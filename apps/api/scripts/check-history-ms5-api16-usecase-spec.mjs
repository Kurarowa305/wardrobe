import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/history/usecases/deleteHistoryWithStatsWrite.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createDeleteHistoryWithStatsWriteUsecase } = await import(usecaseModulePath);

const transactCalls = [];
const findLatestCalls = [];
const usecase = createDeleteHistoryWithStatsWriteUsecase({
  async getHistory() {
    return {
      Item: {
        wardrobeId: "wd_001",
        historyId: "hs_001",
        date: "20260105",
        templateId: "tp_001",
        clothingIds: ["cl_001", "cl_002"],
        createdAt: 1736035200000,
      },
    };
  },
  async getTemplate() {
    return {
      Item: {
        templateId: "tp_001",
        wearCount: 4,
        lastWornAt: Date.UTC(2026, 0, 5, 0, 0, 0, 0),
      },
    };
  },
  async batchGetClothingByIds() {
    return [
      {
        Responses: {
          WardrobeTable: [
            {
              clothingId: "cl_001",
              wearCount: 1,
              lastWornAt: Date.UTC(2026, 0, 5, 0, 0, 0, 0),
            },
            {
              clothingId: "cl_002",
              wearCount: 5,
              lastWornAt: Date.UTC(2026, 0, 3, 0, 0, 0, 0),
            },
          ],
        },
      },
    ];
  },
  async findLatestBeforeDate(input) {
    findLatestCalls.push(input);

    if (input.target.kind === "template") {
      return { date: "20260103" };
    }

    if (input.target.id === "cl_001") {
      return null;
    }

    return { date: "20260101" };
  },
  async getWearDailyCount(input) {
    if (input.target.kind === "template") {
      return 2;
    }

    if (input.target.id === "cl_001") {
      return 1;
    }

    return 3;
  },
  async transactWriteItems(items) {
    transactCalls.push(items);
    return { ok: true };
  },
});

await usecase.delete({ wardrobeId: "wd_001", historyId: "hs_001" });

const transactItems = transactCalls[0] ?? [];

const hasHistoryDelete = transactItems.some((item) => {
  return item?.Delete?.Key?.SK === "HIST#hs_001" && item?.Delete?.ConditionExpression === "attribute_exists(PK)";
});

const hasTemplateDailyDecrement = transactItems.some((item) => {
  return item?.Update?.Key?.PK === "W#wd_001#COUNT#TPL#tp_001"
    && item?.Update?.Key?.SK === "DATE#20260105"
    && item?.Update?.UpdateExpression === "SET #count = #count - :one";
});

const hasClothingDailyDeleteWhenCountBecomesZero = transactItems.some((item) => {
  return item?.Delete?.Key?.PK === "W#wd_001#COUNT#CLOTH#cl_001"
    && item?.Delete?.Key?.SK === "DATE#20260105";
});

const hasClothingDailyDecrement = transactItems.some((item) => {
  return item?.Update?.Key?.PK === "W#wd_001#COUNT#CLOTH#cl_002"
    && item?.Update?.Key?.SK === "DATE#20260105";
});

const hasTemplateCacheUpdateWithRecompute = transactItems.some((item) => {
  return item?.Update?.Key?.SK === "TPL#tp_001"
    && item?.Update?.ExpressionAttributeValues?.[":wearCountDelta"] === -1
    && item?.Update?.ExpressionAttributeValues?.[":lastWornAt"] === Date.UTC(2026, 0, 3, 0, 0, 0, 0);
});

const hasClothingCacheUpdateWithReset = transactItems.some((item) => {
  return item?.Update?.Key?.SK === "CLOTH#cl_001"
    && item?.Update?.ExpressionAttributeValues?.[":lastWornAt"] === 0;
});

const hasClothingCacheUpdateWithoutRecompute = transactItems.some((item) => {
  return item?.Update?.Key?.SK === "CLOTH#cl_002"
    && item?.Update?.ExpressionAttributeValues?.[":lastWornAt"] === Date.UTC(2026, 0, 3, 0, 0, 0, 0);
});

let notFoundCode = null;
try {
  const missingUsecase = createDeleteHistoryWithStatsWriteUsecase({
    async getHistory() {
      return {};
    },
    async transactWriteItems() {
      return { ok: true };
    },
  });

  await missingUsecase.delete({ wardrobeId: "wd_001", historyId: "hs_missing" });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "API-16 usecase executes one transaction with history delete",
    ok: transactCalls.length === 1 && hasHistoryDelete,
    detail: transactItems,
  },
  {
    name: "API-16 usecase decrements wearDaily counters and deletes daily item when count reaches zero",
    ok: hasTemplateDailyDecrement && hasClothingDailyDeleteWhenCountBecomesZero && hasClothingDailyDecrement,
    detail: transactItems,
  },
  {
    name: "API-16 usecase applies wearCount decrement and recomputed lastWornAt per target",
    ok: hasTemplateCacheUpdateWithRecompute && hasClothingCacheUpdateWithReset && hasClothingCacheUpdateWithoutRecompute,
    detail: transactItems,
  },
  {
    name: "API-16 usecase recomputes only when deleted date was current lastWornAt",
    ok: findLatestCalls.length === 2
      && findLatestCalls.some((call) => call.target.kind === "template")
      && findLatestCalls.some((call) => call.target.id === "cl_001"),
    detail: findLatestCalls,
  },
  {
    name: "API-16 usecase maps missing history to NOT_FOUND",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports API-16 usecase and package / CI wiring",
    ok:
      source.includes("export function createDeleteHistoryWithStatsWriteUsecase")
      && packageJson.includes('"test:history-ms5-api16-usecase": "node --import tsx/esm scripts/check-history-ms5-api16-usecase-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-ms5-api16-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T11 API-16 usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T11 API-16 usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
