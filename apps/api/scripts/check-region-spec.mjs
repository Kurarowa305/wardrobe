import assert from "node:assert/strict";
import { searchRegionsHandler } from "../src/domains/region/handlers/regionHandlers.ts";
const response = await searchRegionsHandler({ query: { q: "ｼﾝｼﾞｭｸ" } });
assert.deepEqual(response.json.items, [
  { regionId: "abr:lg:131041", label: "東京都 新宿区" },
]);
console.log("region API search OK");
const { getWardrobeRegionHandler, saveWardrobeRegionHandler } = await import(
  "../src/domains/region/handlers/regionHandlers.ts"
);
const store = new Map([["wd_test", { name: "My wardrobe", createdAt: 42 }]]);
const repo = {
  async get(id) {
    return store.get(id);
  },
  async save(id, region, expectedRevision) {
    const item = store.get(id);
    if (!item || (item.regionRevision ?? 0) !== expectedRevision)
      throw Object.assign(new Error("conflict"), {
        name: "ConditionalCheckFailedException",
      });
    store.set(id, { ...item, region, regionRevision: expectedRevision + 1 });
  },
};
const path = { wardrobeId: "wd_test" };
assert.deepEqual((await getWardrobeRegionHandler({ path, repo })).json, {
  revision: 0,
  region: null,
});
const body = {
  regionId: "abr:lg:131041",
  datasetVersion: response.json.datasetVersion,
  expectedRevision: 0,
};
assert.equal(
  (
    await saveWardrobeRegionHandler({
      path,
      repo,
      body,
      headers: { "content-type": "application/json" },
    })
  ).json.revision,
  1,
);
assert.equal(
  (await getWardrobeRegionHandler({ path, repo })).json.region.label,
  "東京都 新宿区",
);
await assert.rejects(
  saveWardrobeRegionHandler({
    path,
    repo,
    body,
    headers: { "content-type": "application/json" },
  }),
  (error) => error.details.reason === "REGION_CHANGED",
);
console.log("region API persistence and CAS OK");
const headers = { "content-type": "application/json" };
const clear = await saveWardrobeRegionHandler({
  path,
  repo,
  headers,
  body: { regionId: null, expectedRevision: 1 },
});
assert.deepEqual(clear.json, { revision: 2, region: null });
assert.equal(store.get("wd_test").name, "My wardrobe");
assert.equal(store.get("wd_test").createdAt, 42);
for (const query of [
  { q: "" },
  { q: " ".repeat(5) },
  { q: "a".repeat(65) },
  { q: ["新宿", "津"] },
  { q: "津", mode: "summer" },
  {},
])
  await assert.rejects(
    searchRegionsHandler({ query }),
    (e) => e.code === "VALIDATION_ERROR",
  );
for (const [q, codes] of [
  ["府中市", ["132063", "342084"]],
  ["横浜 中区", ["141046"]],
  ["津", ["242012"]],
  ["とうきょうと ふちゅう", ["132063"]],
]) {
  const result = (await searchRegionsHandler({ query: { q } })).json;
  for (const code of codes)
    assert.ok(result.items.some((item) => item.regionId === `abr:lg:${code}`));
}
assert.equal(
  (await searchRegionsHandler({ query: { q: "東京" } })).json.hasMore,
  true,
);
assert.deepEqual(
  (await searchRegionsHandler({ query: { q: "存在しない自治体" } })).json.items,
  [],
);
await assert.rejects(
  getWardrobeRegionHandler({ path: { wardrobeId: "missing" }, repo }),
  (e) => e.code === "NOT_FOUND",
);
for (const extra of [
  { expectedRevision: "2" },
  { expectedRevision: -1 },
  { expectedRevision: 2.1 },
  { expectedRevision: Number.MAX_SAFE_INTEGER + 1 },
  { mode: "auto" },
  { latitude: 35 },
])
  await assert.rejects(
    saveWardrobeRegionHandler({
      path,
      repo,
      headers,
      body: { ...body, expectedRevision: 2, ...extra },
    }),
    (e) => e.code === "VALIDATION_ERROR",
  );
await assert.rejects(
  saveWardrobeRegionHandler({
    path,
    repo,
    headers,
    body: { ...body, expectedRevision: 2, datasetVersion: "old" },
  }),
  (e) => e.details.reason === "REGION_DATASET_CHANGED",
);
await assert.rejects(
  saveWardrobeRegionHandler({
    path,
    repo,
    headers,
    body: { ...body, expectedRevision: 2, regionId: "abr:lg:000000" },
  }),
  (e) => e.details.reason === "UNKNOWN_REGION",
);
await assert.rejects(
  saveWardrobeRegionHandler({
    path,
    repo,
    headers: { "content-type": "text/plain" },
    body,
  }),
  (e) => e.code === "UNSUPPORTED_MEDIA_TYPE",
);
const results = await Promise.allSettled(
  [1, 2].map(() =>
    saveWardrobeRegionHandler({
      path,
      repo,
      headers,
      body: { ...body, expectedRevision: 2 },
    }),
  ),
);
assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
const { handler } = await import("../src/entry/lambda/wardrobe_server.ts");
const lambda = await handler({
  rawPath: "/regions",
  rawQueryString: "q=%E6%B4%A5",
  requestContext: { http: { method: "GET" } },
});
assert.equal(JSON.parse(lambda.body).items[0].regionId, "abr:lg:242012");
const duplicate = await handler({
  rawPath: "/regions",
  rawQueryString: "q=津&q=新宿",
  requestContext: { http: { method: "GET" } },
});
assert.equal(duplicate.statusCode, 400);
console.log(
  "region validation, normalization, disambiguation, CAS race and Lambda routing OK",
);

// DynamoDB is an external boundary: verify the actual repository's wire contract.
const { createRegionRepo } = await import(
  "../src/domains/region/repo/regionRepo.ts"
);
const wire = [];
const dbRepo = createRegionRepo({
  async getItem(input) {
    wire.push(input);
    return { Item: { name: "old" } };
  },
  async updateItem(input) {
    wire.push(input);
    return {};
  },
});
assert.deepEqual(
  (await getWardrobeRegionHandler({ path, repo: dbRepo })).json,
  { revision: 0, region: null },
);
await saveWardrobeRegionHandler({ path, repo: dbRepo, headers, body });
const update = wire.at(-1);
assert.deepEqual(update.Key, { PK: "W#wd_test", SK: "META" });
assert.match(update.ConditionExpression, /attribute_exists\(PK\)/);
assert.match(update.ConditionExpression, /attribute_not_exists\(#revision\)/);
assert.equal(update.ExpressionAttributeValues[":expected"], 0);
assert.equal(update.ExpressionAttributeValues[":next"], 1);
assert.equal(
  update.ExpressionAttributeValues[":region"].sourceSrid,
  "EPSG:6668",
);
assert.equal(update.ExpressionAttributeValues[":region"].latitude, 35.69389);
assert.equal(update.ExpressionAttributeValues[":region"].longitude, 139.703463);
assert.ok(
  wire
    .filter((item) => "ConsistentRead" in item)
    .every((item) => item.ConsistentRead),
);
await saveWardrobeRegionHandler({
  path,
  repo: dbRepo,
  headers,
  body: { regionId: null, expectedRevision: 1 },
});
assert.doesNotMatch(wire.at(-1).ConditionExpression, /attribute_not_exists/);
assert.equal(wire.at(-1).ExpressionAttributeValues[":region"], null);
const { createServer } = await import("node:http");
const { createLocalRouter } = await import("../src/entry/local/router.ts");
const router = createLocalRouter();
const server = createServer(async (req, res) => {
  const { response } = await router.dispatch(req);
  res.writeHead(response.statusCode, response.headers);
  res.end(response.body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/regions?q=新宿`,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).items[0].regionId, "abr:lg:131041");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
console.log(
  "Region DynamoDB conditional wire contract and local HTTP routing OK",
);
