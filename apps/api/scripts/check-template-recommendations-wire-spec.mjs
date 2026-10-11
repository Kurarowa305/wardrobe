import assert from "node:assert/strict";
import { createServer } from "node:http";
import { getTemplateRecommendationsHandler } from "../src/domains/template/recommendations/handler.ts";
const attribute = (value) =>
  value === null
    ? { NULL: true }
    : typeof value === "string"
      ? { S: value }
      : typeof value === "number"
        ? { N: String(value) }
        : Array.isArray(value)
          ? { L: value.map(attribute) }
          : { M: marshall(value) };
const marshall = (value) =>
  Object.fromEntries(Object.entries(value).map(([k, v]) => [k, attribute(v)]));
let queries = 0,
  batches = 0,
  gets = 0,
  active = 0,
  maxActive = 0,
  fail = false;
const server = createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  const op = req.headers["x-amz-target"].split(".").at(-1);
  const reply = (value) => {
    res.writeHead(200, { "content-type": "application/x-amz-json-1.0" });
    res.end(JSON.stringify(value));
  };
  if (op === "GetItem") {
    gets++;
    assert.equal(body.ConsistentRead, true);
    reply({ Item: marshall({ regionRevision: 0 }) });
    return;
  }
  if (op === "Query") {
    queries++;
    assert.equal(body.ConsistentRead, true);
    assert.equal(body.IndexName, undefined);
    assert.equal(body.ExpressionAttributeValues[":pk"].S, "W#wd_wire#TPL");
    if (fail) {
      res.writeHead(400, { "content-type": "application/x-amz-json-1.0" });
      res.end(
        JSON.stringify({
          __type: "ProvisionedThroughputExceededException",
          message: "throttle",
        }),
      );
      return;
    }
    const page = Number(body.ExclusiveStartKey?.SK?.S ?? 0);
    reply({
      Items: Array.from({ length: 200 }, (_, i) => {
        const n = page * 200 + i;
        return marshall({
          templateId: `tp_${String(n).padStart(4, "0")}`,
          name: "n",
          status: n % 2 ? "DELETED" : "ACTIVE",
          clothingIds: [`cl_${n}`],
          tagIds: ["season:all"],
          createdAt: n,
          revision: 1,
        });
      }),
      ...(page < 4
        ? {
            LastEvaluatedKey: marshall({
              PK: "W#wd_wire#TPL",
              SK: String(page + 1),
            }),
          }
        : {}),
    });
    return;
  }
  assert.equal(op, "BatchGetItem");
  batches++;
  active++;
  maxActive = Math.max(maxActive, active);
  const request = body.RequestItems.WardrobeTable;
  assert.equal(request.ConsistentRead, true);
  assert.ok(request.Keys.length <= 80);
  await new Promise((resolve) => setTimeout(resolve, 10));
  active--;
  reply({
    Responses: {
      WardrobeTable: request.Keys.map((key) => {
        const id = key.SK.S.slice(6);
        return marshall({
          clothingId: id,
          status: "ACTIVE",
          lastWornAt: 0,
          imageKey: null,
        });
      }),
    },
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
process.env.DDB_ENDPOINT = `http://127.0.0.1:${server.address().port}`;
process.env.TABLE_NAME = "WardrobeTable";
const input = {
  path: { wardrobeId: "wd_wire" },
  query: { mode: "summer", date: "2026-10-11", regionRevision: "0" },
  dependencies: { now: () => Date.parse("2026-10-11T02:00:00Z") },
};
try {
  const started = performance.now();
  const result = await getTemplateRecommendationsHandler(input);
  assert.deepEqual(
    result.json.items.map((x) => x.templateId),
    ["tp_0000", "tp_0002", "tp_0004"],
  );
  assert.equal(queries, 5);
  assert.equal(batches, 7);
  assert.equal(gets, 2);
  assert.equal(maxActive, 4);
  console.log(
    `Read benchmark: total templates=1000 (deleted=500), unique clothing=500, Query=5 BatchGet=7 maxConcurrent=${maxActive} META=2 elapsedMs=${Math.round(performance.now() - started)}`,
  );
  const { handler } = await import('../src/entry/lambda/template_server.ts');
  const today = new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  const lambda = await handler({rawPath:'/wardrobes/wd_wire/recommendations/templates',pathParameters:{wardrobeId:'wd_wire'},rawQueryString:`mode=summer&date=${today}&regionRevision=0`,requestContext:{http:{method:'GET'}}});
  assert.equal(lambda.statusCode,200);assert.equal(JSON.parse(lambda.body).items.length,3);
  const duplicate = await handler({rawPath:'/wardrobes/wd_wire/recommendations/templates',pathParameters:{wardrobeId:'wd_wire'},rawQueryString:`mode=summer&mode=winter&date=${today}&regionRevision=0`,requestContext:{http:{method:'GET'}}});assert.equal(duplicate.statusCode,400);
  fail = true;
  const prior = queries;
  await assert.rejects(
    getTemplateRecommendationsHandler(input),
    (e) => e.status === 503,
  );
  assert.equal(queries - prior, 1);
  console.log(
    "Real AWS SDK wire: strong consistency, all pages, 80/4 batching, maxAttempts=1 OK",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
