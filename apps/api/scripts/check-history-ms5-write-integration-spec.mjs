import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const createHandlerPath = path.join(root, "src/domains/history/handlers/createHistoryHandler.ts");
const deleteHandlerPath = path.join(root, "src/domains/history/handlers/deleteHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryHandler } = await import(createHandlerPath);
const { deleteHistoryHandler } = await import(deleteHandlerPath);

const DATE_PATTERN = /^DATE#(\d{8})$/;

const toEpochMs = (date) => {
  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(4, 6), 10);
  const day = Number.parseInt(date.slice(6, 8), 10);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
};

const extractTargetFromDailyPk = (pk) => {
  const segments = pk.split("#");
  if (segments.length < 5) {
    return null;
  }

  const kindSegment = segments[3];
  const id = segments.slice(4).join("#");

  if (kindSegment === "TPL") {
    return { kind: "template", id };
  }

  if (kindSegment === "CLOTH") {
    return { kind: "clothing", id };
  }

  return null;
};

const buildDailyKeyString = (wardrobeId, target, date) => {
  const segment = target.kind === "template" ? "TPL" : "CLOTH";
  return `W#${wardrobeId}#COUNT#${segment}#${target.id}|DATE#${date}`;
};

const createState = () => {
  const baseItems = new Map([
    ["W#wd_001#TPL|TPL#tp_001", { PK: "W#wd_001#TPL", SK: "TPL#tp_001", templateId: "tp_001", wearCount: 2, lastWornAt: toEpochMs("20260103") }],
    ["W#wd_001#CLOTH|CLOTH#cl_001", { PK: "W#wd_001#CLOTH", SK: "CLOTH#cl_001", clothingId: "cl_001", wearCount: 3, lastWornAt: toEpochMs("20260104") }],
    ["W#wd_001#CLOTH|CLOTH#cl_002", { PK: "W#wd_001#CLOTH", SK: "CLOTH#cl_002", clothingId: "cl_002", wearCount: 1, lastWornAt: toEpochMs("20260102") }],
  ]);

  const wearDaily = new Map([
    [buildDailyKeyString("wd_001", { kind: "template", id: "tp_001" }, "20260103"), 2],
    [buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_001" }, "20260104"), 2],
    [buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_002" }, "20260102"), 1],
  ]);

  return {
    items: baseItems,
    wearDaily,
    histories: new Map(),
    transactCalls: [],
  };
};

const createDependencies = (state) => ({
  now: () => toEpochMs("20260110"),
  generateHistoryId: () => `hs_${String(state.histories.size + 1).padStart(3, "0")}`,
  async getHistory({ wardrobeId, historyId }) {
    const key = `W#${wardrobeId}#HIST|HIST#${historyId}`;
    const item = state.histories.get(key);
    return item ? { Item: item } : {};
  },
  async getTemplate({ wardrobeId, templateId }) {
    return { Item: state.items.get(`W#${wardrobeId}#TPL|TPL#${templateId}`) };
  },
  async batchGetClothingByIds({ wardrobeId, clothingIds }) {
    const found = clothingIds
      .map((clothingId) => state.items.get(`W#${wardrobeId}#CLOTH|CLOTH#${clothingId}`))
      .filter(Boolean);

    return [{ Responses: { WardrobeTable: found } }];
  },
  async findLatestBeforeDate({ wardrobeId, target, beforeDate }) {
    let latest = null;
    for (const [key, count] of state.wearDaily.entries()) {
      if (count <= 0) {
        continue;
      }

      const [pk, sk] = key.split("|");
      const targetFromPk = extractTargetFromDailyPk(pk);
      const dateMatch = sk.match(DATE_PATTERN);
      if (!targetFromPk || !dateMatch) {
        continue;
      }

      if (pk.startsWith(`W#${wardrobeId}#`) && targetFromPk.kind === target.kind && targetFromPk.id === target.id) {
        const date = dateMatch[1];
        if (date < beforeDate && (latest === null || date > latest)) {
          latest = date;
        }
      }
    }

    return latest ? { date: latest } : null;
  },
  async getWearDailyCount({ wardrobeId, target, date }) {
    const key = buildDailyKeyString(wardrobeId, target, date);
    return state.wearDaily.get(key) ?? null;
  },
  async transactWriteItems(items) {
    state.transactCalls.push(items);

    const localItems = new Map(state.items);
    const localDaily = new Map(state.wearDaily);
    const localHistories = new Map(state.histories);

    for (const item of items) {
      if (item.ConditionCheck) {
        const key = `${item.ConditionCheck.Key.PK}|${item.ConditionCheck.Key.SK}`;
        if (!localItems.has(key)) {
          const error = new Error("Transaction cancelled");
          error.name = "TransactionCanceledException";
          error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
          throw error;
        }
      }

      if (item.Put) {
        const putKey = `${item.Put.Item.PK}|${item.Put.Item.SK}`;
        if (localHistories.has(putKey)) {
          const error = new Error("Transaction cancelled");
          error.name = "TransactionCanceledException";
          error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
          throw error;
        }
        localHistories.set(putKey, item.Put.Item);
      }

      if (item.Delete) {
        const deleteKey = `${item.Delete.Key.PK}|${item.Delete.Key.SK}`;
        if (deleteKey.includes("#HIST|HIST#")) {
          if (!localHistories.has(deleteKey)) {
            const error = new Error("Transaction cancelled");
            error.name = "TransactionCanceledException";
            error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
            throw error;
          }
          localHistories.delete(deleteKey);
          continue;
        }

        localDaily.delete(deleteKey);
      }

      if (item.Update) {
        const updateKey = `${item.Update.Key.PK}|${item.Update.Key.SK}`;

        if (updateKey.includes("#COUNT#")) {
          const current = localDaily.get(updateKey) ?? 0;
          if (item.Update.UpdateExpression.includes("if_not_exists")) {
            const delta = item.Update.ExpressionAttributeValues[":countDelta"];
            const next = current + delta;
            if (next < 0) {
              throw new Error(`wearDaily count underflow: ${updateKey}`);
            }
            localDaily.set(updateKey, next);
            continue;
          }

          if (item.Update.UpdateExpression.includes("#count = #count - :one")) {
            const next = current - 1;
            if (next < 0) {
              throw new Error(`wearDaily count underflow: ${updateKey}`);
            }
            localDaily.set(updateKey, next);
            continue;
          }
        }

        const existing = localItems.get(updateKey);
        if (!existing) {
          const error = new Error("Transaction cancelled");
          error.name = "TransactionCanceledException";
          error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
          throw error;
        }

        const wearCountDelta = item.Update.ExpressionAttributeValues?.[":wearCountDelta"];
        const lastWornAt = item.Update.ExpressionAttributeValues?.[":lastWornAt"];

        if (typeof wearCountDelta === "number") {
          existing.wearCount = (existing.wearCount ?? 0) + wearCountDelta;
        }

        if (typeof lastWornAt === "number") {
          existing.lastWornAt = lastWornAt;
        }

        localItems.set(updateKey, existing);
      }
    }

    state.items = localItems;
    state.wearDaily = localDaily;
    state.histories = localHistories;

    return { ok: true };
  },
});

const assertState = (condition, message, detail) => {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
};

const runScenario = async () => {
  const state = createState();
  const deps = createDependencies(state);

  const templateCreate = await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260105", templateId: "tp_001" },
    headers: { "content-type": "application/json" },
    requestId: "req-ms5-int-create-template",
    dependencies: deps,
  });

  const templateHistoryId = JSON.parse(templateCreate.body).historyId;

  const clothingCreate = await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260106", clothingIds: ["cl_001", "cl_002"] },
    headers: { "content-type": "application/json" },
    requestId: "req-ms5-int-create-clothing",
    dependencies: deps,
  });

  const clothingHistoryId = JSON.parse(clothingCreate.body).historyId;

  const templateAfterCreate = state.items.get("W#wd_001#TPL|TPL#tp_001");
  assertState(templateAfterCreate?.wearCount === 3, "template wearCount should increase on create", templateAfterCreate);
  assertState(templateAfterCreate?.lastWornAt === toEpochMs("20260105"), "template lastWornAt should become created date", templateAfterCreate);

  const clothing1AfterCreate = state.items.get("W#wd_001#CLOTH|CLOTH#cl_001");
  const clothing2AfterCreate = state.items.get("W#wd_001#CLOTH|CLOTH#cl_002");
  assertState(clothing1AfterCreate?.wearCount === 4, "clothing cl_001 wearCount should increase on create", clothing1AfterCreate);
  assertState(clothing2AfterCreate?.wearCount === 2, "clothing cl_002 wearCount should increase on create", clothing2AfterCreate);
  assertState(clothing1AfterCreate?.lastWornAt === toEpochMs("20260106"), "clothing cl_001 lastWornAt should become created date", clothing1AfterCreate);
  assertState(clothing2AfterCreate?.lastWornAt === toEpochMs("20260106"), "clothing cl_002 lastWornAt should become created date", clothing2AfterCreate);

  assertState(state.wearDaily.get(buildDailyKeyString("wd_001", { kind: "template", id: "tp_001" }, "20260105")) === 1,
    "template wearDaily should be incremented for create date", state.wearDaily);
  assertState(state.wearDaily.get(buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_001" }, "20260106")) === 1,
    "clothing cl_001 wearDaily should be incremented for create date", state.wearDaily);
  assertState(state.wearDaily.get(buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_002" }, "20260106")) === 1,
    "clothing cl_002 wearDaily should be incremented for create date", state.wearDaily);

  const templateDelete = await deleteHistoryHandler({
    path: { wardrobeId: "wd_001", historyId: templateHistoryId },
    requestId: "req-ms5-int-delete-template",
    dependencies: deps,
  });

  const clothingDelete = await deleteHistoryHandler({
    path: { wardrobeId: "wd_001", historyId: clothingHistoryId },
    requestId: "req-ms5-int-delete-clothing",
    dependencies: deps,
  });

  assertState(templateDelete.statusCode === 204 && clothingDelete.statusCode === 204,
    "delete handlers should return 204", { templateDelete, clothingDelete });

  const templateAfterDelete = state.items.get("W#wd_001#TPL|TPL#tp_001");
  assertState(templateAfterDelete?.wearCount === 2, "template wearCount should return to baseline after delete", templateAfterDelete);
  assertState(templateAfterDelete?.lastWornAt === toEpochMs("20260103"), "template lastWornAt should recompute to previous date", templateAfterDelete);

  const clothing1AfterDelete = state.items.get("W#wd_001#CLOTH|CLOTH#cl_001");
  const clothing2AfterDelete = state.items.get("W#wd_001#CLOTH|CLOTH#cl_002");
  assertState(clothing1AfterDelete?.wearCount === 3, "clothing cl_001 wearCount should return to baseline after delete", clothing1AfterDelete);
  assertState(clothing2AfterDelete?.wearCount === 1, "clothing cl_002 wearCount should return to baseline after delete", clothing2AfterDelete);
  assertState(clothing1AfterDelete?.lastWornAt === toEpochMs("20260104"), "clothing cl_001 lastWornAt should recompute to previous date", clothing1AfterDelete);
  assertState(clothing2AfterDelete?.lastWornAt === toEpochMs("20260102"), "clothing cl_002 lastWornAt should recompute to previous date", clothing2AfterDelete);

  assertState(!state.wearDaily.has(buildDailyKeyString("wd_001", { kind: "template", id: "tp_001" }, "20260105")),
    "template wearDaily on created date should be removed after delete", state.wearDaily);
  assertState(!state.wearDaily.has(buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_001" }, "20260106")),
    "clothing cl_001 wearDaily on created date should be removed after delete", state.wearDaily);
  assertState(!state.wearDaily.has(buildDailyKeyString("wd_001", { kind: "clothing", id: "cl_002" }, "20260106")),
    "clothing cl_002 wearDaily on created date should be removed after delete", state.wearDaily);

  assertState(!state.histories.has(`W#wd_001#HIST|HIST#${templateHistoryId}`) && !state.histories.has(`W#wd_001#HIST|HIST#${clothingHistoryId}`),
    "created histories should be removed after delete", state.histories);

  return {
    transactCount: state.transactCalls.length,
    templateHistoryId,
    clothingHistoryId,
  };
};

const checks = [];
try {
  const result = await runScenario();
  checks.push({
    name: "create/delete 統合で wearCount, wearDaily, lastWornAt の整合を維持できる",
    ok: result.transactCount === 4,
    detail: result,
  });
} catch (error) {
  checks.push({
    name: "create/delete 統合で wearCount, wearDaily, lastWornAt の整合を維持できる",
    ok: false,
    detail: error?.detail ?? error,
  });
}

checks.push({
  name: "package script と CI に BE-MS5-T13 テスト導線がある",
  ok:
    packageJson.includes('"test:history-ms5-write-integration": "node --import tsx/esm scripts/check-history-ms5-write-integration-spec.mjs"')
    && ciSource.includes("pnpm --filter api test:history-ms5-write-integration"),
  detail: { packageJson, ciSource },
});

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T13 更新系統合テスト spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T13 更新系統合テスト spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
