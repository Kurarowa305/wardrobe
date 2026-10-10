import assert from "node:assert/strict";
import { createHistoryHandler } from "../src/domains/history/handlers/createHistoryHandler.ts";
import { deleteHistoryHandler } from "../src/domains/history/handlers/deleteHistoryHandler.ts";
import { createDynamoDbClient } from "../src/clients/dynamodb.ts";
import { createHistoryWithStatsWriteUsecase } from "../src/domains/history/usecases/createHistoryWithStatsWrite.ts";
import { createDeleteHistoryWithStatsWriteUsecase } from "../src/domains/history/usecases/deleteHistoryWithStatsWrite.ts";
import { createClothingRepo } from "../src/domains/clothing/repo/clothingRepo.ts";
import { createTemplateRepo } from "../src/domains/template/repo/templateRepo.ts";
import { createClothingBatchGetRepo } from "../src/domains/clothing/repo/clothingBatchGetRepo.ts";
import { createHistoryRepo } from "../src/domains/history/repo/historyRepo.ts";
import { createWearDailyQueryRepo } from "../src/domains/history/stats_write/repo/wearDailyQueryRepo.ts";
import { buildWearDailyKey } from "../src/domains/history/stats_write/keys.ts";
import { createWearStatsStore } from "./helpers/wearStatsStore.mjs";

const epoch = (date) =>
  Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8));
async function setup() {
  const store = createWearStatsStore();
  const client = createDynamoDbClient({
    tableName: "test",
    documentClient: store,
  });
  const clothing = createClothingRepo(client),
    template = createTemplateRepo(client);
  const history = createHistoryRepo(client),
    batch = createClothingBatchGetRepo(client),
    daily = createWearDailyQueryRepo(client);
  const common = {
    wardrobeId: "w",
    name: "before",
    status: "ACTIVE",
    tagIds: [],
    createdAt: 1,
    deletedAt: null,
    wearCount: 0,
    lastWornAt: 0,
  };
  for (const id of ["c1", "c2"])
    await clothing.create({
      ...common,
      clothingId: id,
      genre: "tops",
      imageKey: null,
    });
  await template.create({
    ...common,
    templateId: "t",
    clothingIds: ["c1", "c2"],
  });
  let counter = 0;
  const dependencies = {
    now: () => 1,
    generateHistoryId: () => `h${++counter}`,
    getHistory: (input) => history.get(input),
    getTemplate: (input) => template.get(input),
    batchGetClothingByIds: (input) => batch.batchGetByIds(input),
    findLatestBeforeDate: (input) => daily.findLatestBeforeDate(input),
    getWearDailyCount: async (input) =>
      (
        await client.getItem({
          Key: buildWearDailyKey(input),
          ConsistentRead: true,
        })
      ).Item?.count ?? null,
    transactWriteItems: (items) =>
      client.transactWriteItems({ TransactItems: items }),
  };
  const create = createHistoryWithStatsWriteUsecase(dependencies);
  const remove = createDeleteHistoryWithStatsWriteUsecase(dependencies);
  return {
    store,
    client,
    clothing,
    template,
    dependencies,
    record: (date, templateMode = false) =>
      create.create({
        wardrobeId: "w",
        date,
        ...(templateMode ? { templateId: "t" } : { clothingIds: ["c1", "c2"] }),
      }),
    remove: (historyId) => remove.delete({ wardrobeId: "w", historyId }),
  };
}
function checkStats(store, segment, id, count, date) {
  const item = store.read(`W#w#${segment}|${segment}#${id}`);
  assert.equal(item.wearCount, count);
  assert.equal(item.lastWornAt, date ? epoch(date) : 0);
  assert.equal(
    item.wearCountSk,
    `WEAR#${String(count).padStart(10, "0")}#${id}`,
  );
  assert.equal(item.lastWornAtSk, `LASTWORN#${date ? epoch(date) : 0}#${id}`);
  const daily = store
    .snapshot()
    .filter((row) => row.PK === `W#w#COUNT#${segment}#${id}`);
  assert.equal(
    daily.reduce((sum, row) => sum + row.count, 0),
    count,
  );
  assert.ok(daily.every((row) => row.count > 0));
}
const tests = [];
const test = (name, run) => tests.push({ name, run });
for (const templateMode of [false, true]) {
  test(`${templateMode ? "テンプレート" : "組合せ"}: 同日一部削除・過去日追加・前日へ戻る・全件削除`, async () => {
    const ctx = await setup();
    const first = await ctx.record("20260110", templateMode);
    const second = await ctx.record("20260110", templateMode);
    const targets = [
      ["CLOTH", "c1"],
      ["CLOTH", "c2"],
      ...(templateMode ? [["TPL", "t"]] : []),
    ];
    for (const [segment, id] of targets)
      checkStats(ctx.store, segment, id, 2, "20260110");
    await ctx.remove(first.historyId);
    for (const [segment, id] of targets)
      checkStats(ctx.store, segment, id, 1, "20260110");
    const older = await ctx.record("20260105", templateMode);
    for (const [segment, id] of targets)
      checkStats(ctx.store, segment, id, 2, "20260110");
    await ctx.remove(second.historyId);
    for (const [segment, id] of targets)
      checkStats(ctx.store, segment, id, 1, "20260105");
    await ctx.remove(older.historyId);
    for (const [segment, id] of targets)
      checkStats(ctx.store, segment, id, 0, null);
  });
}
for (const kind of ["clothing", "template"]) {
  test(`${kind}: 記録更新の前に読み取った通常編集が統計を上書きしない`, async () => {
    const ctx = await setup();
    const key = kind === "clothing" ? "W#w#CLOTH|CLOTH#c1" : "W#w#TPL|TPL#t";
    const stale = ctx.store.read(key);
    await ctx.record("20260110", true);
    await ctx[kind].update({ ...stale, name: "after" });
    checkStats(
      ctx.store,
      kind === "clothing" ? "CLOTH" : "TPL",
      kind === "clothing" ? "c1" : "t",
      1,
      "20260110",
    );
    assert.equal(ctx.store.read(key).name, "after");
  });
}
test("再計算は強整合で過去日を取得する", async () => {
  const ctx = await setup();
  await ctx.record("20260105");
  const latest = await ctx.record("20260110");
  await ctx.remove(latest.historyId);
  checkStats(ctx.store, "CLOTH", "c1", 1, "20260105");
});
test("記録追加と削除で件数が元に戻っても古い再計算を競合として拒否する", async () => {
  const ctx = await setup();
  const oldest = await ctx.record("20260101");
  const latest = await ctx.record("20260110");
  let suspended;
  const pending = createDeleteHistoryWithStatsWriteUsecase({
    ...ctx.dependencies,
    transactWriteItems: async (items) => {
      suspended = items;
    },
  });
  await pending.delete({ wardrobeId: "w", historyId: latest.historyId });
  await ctx.record("20260105");
  await ctx.remove(oldest.historyId);
  const before = ctx.store.snapshot();
  await assert.rejects(
    ctx.client.transactWriteItems({ TransactItems: suspended }),
    { name: "TransactionCanceledException" },
  );
  assert.deepEqual(
    ctx.store.snapshot(),
    before,
    "競合時は履歴・日別件数を含め全件ロールバック",
  );
});
test("同じ読取結果からの並行作成は片方だけ成功する", async () => {
  const ctx = await setup();
  const transactions = [];
  const pending = createHistoryWithStatsWriteUsecase({
    ...ctx.dependencies,
    transactWriteItems: async (items) => {
      transactions.push(items);
    },
  });
  for (const date of ["20260105", "20260110"])
    await pending.create({ wardrobeId: "w", date, templateId: "t" });
  await ctx.client.transactWriteItems({ TransactItems: transactions[0] });
  const before = ctx.store.snapshot();
  await assert.rejects(
    ctx.client.transactWriteItems({ TransactItems: transactions[1] }),
    { name: "TransactionCanceledException" },
  );
  assert.deepEqual(ctx.store.snapshot(), before);
});
test("同日最後の削除と追加が競合しても追加分を削除しない", async () => {
  const ctx = await setup();
  const first = await ctx.record("20260110", true);
  let transaction;
  const pending = createDeleteHistoryWithStatsWriteUsecase({
    ...ctx.dependencies,
    transactWriteItems: async (items) => {
      transaction = items;
    },
  });
  await pending.delete({ wardrobeId: "w", historyId: first.historyId });
  await ctx.record("20260110", true);
  const before = ctx.store.snapshot();
  await assert.rejects(
    ctx.client.transactWriteItems({ TransactItems: transaction }),
    { name: "TransactionCanceledException" },
  );
  assert.deepEqual(ctx.store.snapshot(), before);
  await ctx.remove(first.historyId);
  checkStats(ctx.store, "CLOTH", "c1", 1, "20260110");
  checkStats(ctx.store, "TPL", "t", 1, "20260110");
});
test("対象の日別件数が欠落した場合は履歴を削除しない", async () => {
  const ctx = await setup();
  const first = await ctx.record("20260110");
  const before = ctx.store.snapshot();
  const pending = createDeleteHistoryWithStatsWriteUsecase({
    ...ctx.dependencies,
    getWearDailyCount: async () => null,
  });
  await assert.rejects(
    pending.delete({ wardrobeId: "w", historyId: first.historyId }),
    (error) => error.code === "CONFLICT",
  );
  assert.deepEqual(ctx.store.snapshot(), before);
});
test("未来日・共有服・テンプレート編集後も記録時の構成服で削除する", async () => {
  const ctx = await setup();
  const past = await ctx.record("20260110");
  const future = await ctx.record("20300110", true);
  await ctx.template.update({
    ...ctx.store.read("W#w#TPL|TPL#t"),
    clothingIds: ["c1"],
  });
  await ctx.remove(future.historyId);
  checkStats(ctx.store, "CLOTH", "c1", 1, "20260110");
  checkStats(ctx.store, "CLOTH", "c2", 1, "20260110");
  checkStats(ctx.store, "TPL", "t", 0, null);
  await ctx.remove(past.historyId);
  checkStats(ctx.store, "CLOTH", "c2", 0, null);
});
test("作成・削除の統計競合はCONFLICTになり自動再試行しない", async () => {
  for (const mode of ["create", "delete"]) {
    const ctx = await setup();
    const first = await ctx.record("20260110");
    let writes = 0;
    const dependencies = {
      ...ctx.dependencies,
      transactWriteItems: async (items) => {
        writes++;
        await ctx.record("20260111");
        return ctx.dependencies.transactWriteItems(items);
      },
    };
    const request =
      mode === "create"
        ? createHistoryHandler({
            path: { wardrobeId: "w" },
            body: { date: "20260110", clothingIds: ["c1", "c2"] },
            headers: { "content-type": "application/json" },
            dependencies,
          })
        : deleteHistoryHandler({
            path: { wardrobeId: "w", historyId: first.historyId },
            dependencies,
          });
    await assert.rejects(request, (error) => error.code === "CONFLICT");
    assert.equal(writes, 1);
    checkStats(ctx.store, "CLOTH", "c1", 2, "20260111");
  }
});
let failed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
