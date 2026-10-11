import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { createHistoryHandler } from "../src/domains/history/handlers/createHistoryHandler.ts";
import { deleteHistoryHandler } from "../src/domains/history/handlers/deleteHistoryHandler.ts";
process.env.DDB_ENDPOINT = process.env.DDB_ENDPOINT ?? "http://127.0.0.1:8765";
assert.match(
  process.env.DDB_ENDPOINT,
  /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
);
process.env.TABLE_NAME = `ConfirmRecord${Date.now()}`;
const client = new DynamoDBClient({
  endpoint: process.env.DDB_ENDPOINT,
  region: "ap-northeast-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
  maxAttempts: 1,
});
const document = DynamoDBDocumentClient.from(client);
const TableName = process.env.TABLE_NAME;
const wardrobeId = "wd_confirm",
  templateId = "tp_confirm";
const clothingIds = Array.from({ length: 20 }, (_, i) => `cl_${i}`);
const put = (Item) => document.send(new PutCommand({ TableName, Item }));
const get = async (Key) =>
  (
    await document.send(
      new GetCommand({ TableName, Key, ConsistentRead: true }),
    )
  ).Item;
const templateKey = { PK: `W#${wardrobeId}#TPL`, SK: `TPL#${templateId}` };
const clothingKey = (id) => ({
  PK: `W#${wardrobeId}#CLOTH`,
  SK: `CLOTH#${id}`,
});
await client.send(
  new CreateTableCommand({
    TableName,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  }),
);
try {
  await put({
    ...templateKey,
    templateId,
    clothingIds,
    revision: 1,
    status: "ACTIVE",
    wearCount: 0,
    lastWornAt: 0,
  });
  for (const clothingId of clothingIds)
    await put({
      ...clothingKey(clothingId),
      clothingId,
      status: "ACTIVE",
      wearCount: 0,
      lastWornAt: 0,
    });
  const key = randomUUID();
  const body = { date: "20261011", templateId, expectedTemplateRevision: 1 };
  const request = {
    path: { wardrobeId },
    body,
    headers: { "content-type": "application/json", "idempotency-key": key },
  };
  const first = await createHistoryHandler(request);
  assert.equal(first.statusCode, 201);
  const { historyId } = JSON.parse(first.body);
  const replay = await createHistoryHandler(request);
  assert.equal(replay.statusCode, 200);
  assert.equal(JSON.parse(replay.body).historyId, historyId);
  assert.equal((await get(templateKey)).wearCount, 1);
  assert.equal((await get(clothingKey("cl_19"))).wearCount, 1);
  await assert.rejects(
    createHistoryHandler({ ...request, body: { ...body, date: "20261012" } }),
    (e) => e.details.reason === "IDEMPOTENCY_KEY_REUSED",
  );
  await deleteHistoryHandler({ path: { wardrobeId, historyId } });
  await assert.rejects(
    createHistoryHandler(request),
    (e) => e.details.reason === "HISTORY_ALREADY_DELETED",
  );
  assert.equal((await get(templateKey)).wearCount, 0);
  // Separate intentional records on the same day are allowed; statistics never change revision.
  const record = (key) =>
    createHistoryHandler({
      ...request,
      headers: { ...request.headers, "idempotency-key": key },
    });
  const second = await record(randomUUID());
  const third = await record(randomUUID());
  assert.equal((await get(templateKey)).wearCount, 2);
  assert.equal((await get(templateKey)).revision, 1);
  // A successful operation remains replayable after a subsequent template edit.
  const stableKey = randomUUID();
  const stable = await record(stableKey);
  await document.send(
    new UpdateCommand({
      TableName,
      Key: templateKey,
      UpdateExpression: "SET revision = :next",
      ExpressionAttributeValues: { ":next": 2 },
    }),
  );
  const stableReplay = await record(stableKey);
  assert.equal(stableReplay.statusCode, 200);
  assert.equal(stableReplay.body, stable.body);
  await assert.rejects(
    record(randomUUID()),
    (e) => e.details.reason === "CONFIRMATION_STALE",
  );
  // Change the confirmation version after reads, immediately before the real transaction.
  const { createOperationRepo } =
    await import("../src/domains/history/repo/operationRepo.ts");
  const operations = createOperationRepo();
  // A request can miss the operation before another request commits it and edits the template.
  const lateReplay = await createHistoryHandler({
    ...request,
    headers: { ...request.headers, "idempotency-key": stableKey },
    dependencies: { getOperation: (() => {
      let reads = 0;
      return async (...args) => ++reads === 1 ? undefined : operations.get(...args);
    })() },
  });
  assert.equal(lateReplay.statusCode, 200);
  assert.equal(lateReplay.body, stable.body);
  await assert.rejects(createHistoryHandler({
    ...request,
    dependencies: { getOperation: (() => {
      let reads = 0;
      return async (...args) => ++reads === 1 ? undefined : operations.get(...args);
    })() },
  }), (error) => error.details.reason === "HISTORY_ALREADY_DELETED");
  const racedRequest = {
    ...request,
    body: { ...body, expectedTemplateRevision: 2 },
    headers: { ...request.headers, "idempotency-key": randomUUID() },
    dependencies: {
      transactWriteItems: async (items) => {
        await document.send(
          new UpdateCommand({
            TableName,
            Key: templateKey,
            UpdateExpression: "SET revision = :next",
            ExpressionAttributeValues: { ":next": 3 },
          }),
        );
        return operations.write(items);
      },
    },
  };
  await assert.rejects(
    createHistoryHandler(racedRequest),
    (e) => e.details.reason === "CONFIRMATION_STALE",
  );
  assert.equal((await get(templateKey)).wearCount, 3);
  // Lost commit responses are resolved through the same durable operation record.
  const lostKey = randomUUID();
  const lost = await createHistoryHandler({
    ...request,
    body: { ...body, expectedTemplateRevision: 3 },
    headers: { ...request.headers, "idempotency-key": lostKey.toUpperCase() },
    dependencies: {
      transactWriteItems: async (items) => {
        await operations.write(items);
        throw new Error("response lost");
      },
    },
  });
  assert.equal(lost.statusCode, 200);
  const recovered = await createHistoryHandler({
    ...request,
    body: { ...body, expectedTemplateRevision: 3 },
    headers: { ...request.headers, "idempotency-key": lostKey },
  });
  assert.equal(recovered.body, lost.body);
  const sameKey = randomUUID();
  const concurrentRequest = {
    ...request,
    body: { ...body, expectedTemplateRevision: 3 },
    headers: { ...request.headers, "idempotency-key": sameKey },
  };
  const beforeConcurrent = (await get(templateKey)).wearCount;
  const concurrent = await Promise.allSettled([
    createHistoryHandler(concurrentRequest),
    createHistoryHandler(concurrentRequest),
  ]);
  assert(concurrent.some((result) => result.status === "fulfilled"));
  const afterConcurrent = await createHistoryHandler(concurrentRequest);
  assert.equal(afterConcurrent.statusCode, 200);
  assert.equal((await get(templateKey)).wearCount, beforeConcurrent + 1);
  // Deleted clothing invalidates a fresh confirmation; deleting existing histories still succeeds.
  await document.send(
    new UpdateCommand({
      TableName,
      Key: clothingKey("cl_19"),
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "DELETED" },
    }),
  );
  await assert.rejects(
    createHistoryHandler({
      ...request,
      body: { ...body, expectedTemplateRevision: 3 },
      headers: { ...request.headers, "idempotency-key": randomUUID() },
    }),
    (e) => e.details.reason === "CONFIRMATION_STALE",
  );
  await deleteHistoryHandler({
    path: { wardrobeId, historyId: JSON.parse(second.body).historyId },
  });
  assert.equal((await get(templateKey)).wearCount, beforeConcurrent);
  // Legacy callers still create records without confirmation headers, including future dates.
  const legacy = await createHistoryHandler({
    path: { wardrobeId },
    headers: { "content-type": "application/json" },
    body: { date: "20301231", templateId },
  });
  assert.equal(legacy.statusCode, 201);
  console.log(
    "20 clothing + operation, replay/deletion, distinct intent, stale race and legacy contract passed",
  );
} finally {
  await client.send(new DeleteTableCommand({ TableName }));
  client.destroy();
}
