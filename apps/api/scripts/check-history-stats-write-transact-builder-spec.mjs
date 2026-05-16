import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const builderPath = path.join(root, "src/domains/history/stats_write/transact/buildItems.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const builderModule = await import(builderPath);
const builderSource = readFileSync(builderPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const currentStatsByTarget = new Map([
  ["template:tp_01HZZBBB", {
    wearCount: 6,
    lastWornAt: Date.UTC(2026, 0, 6, 0, 0, 0, 0),
  }],
  ["clothing:cl_01HZZCCC", {
    wearCount: 11,
    lastWornAt: Date.UTC(2026, 0, 6, 0, 0, 0, 0),
  }],
]);

const resolveCurrentStats = (fact) => currentStatsByTarget.get(`${fact.target.kind}:${fact.target.id}`);

const createItems = builderModule.buildHistoryStatsWriteItems({
  wearDailyFacts: [
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "template", id: "tp_01HZZBBB" },
      date: "20260107",
      count: 1,
    },
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "clothing", id: "cl_01HZZCCC" },
      date: "20260107",
      count: 1,
    },
  ],
  cacheUpdateFacts: [
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "template", id: "tp_01HZZBBB" },
      wearCountDelta: 1,
      lastWornAt: { mode: "max", epochMs: Date.UTC(2026, 0, 7, 0, 0, 0, 0) },
    },
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "clothing", id: "cl_01HZZCCC" },
      wearCountDelta: 1,
      lastWornAt: { mode: "max", epochMs: Date.UTC(2026, 0, 7, 0, 0, 0, 0) },
    },
  ],
  resolveCurrentStats,
});

const deleteItems = builderModule.buildHistoryStatsWriteItems({
  wearDailyFacts: [
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "clothing", id: "cl_01HZZCCC" },
      date: "20260107",
      count: -1,
    },
  ],
  cacheUpdateFacts: [
    {
      wardrobeId: "wd_01HZZAAA",
      target: { kind: "clothing", id: "cl_01HZZCCC" },
      wearCountDelta: -1,
      lastWornAt: { mode: "recompute" },
    },
  ],
  resolveCurrentStats,
  resolveRecomputedLastWornAt: () => Date.UTC(2026, 0, 2, 0, 0, 0, 0),
});

let missingRecomputeError = "";
try {
  builderModule.buildHistoryStatsWriteItems({
    wearDailyFacts: [],
    cacheUpdateFacts: [
      {
        wardrobeId: "wd_01HZZAAA",
        target: { kind: "template", id: "tp_01HZZBBB" },
        wearCountDelta: -1,
        lastWornAt: { mode: "recompute" },
      },
    ],
    resolveCurrentStats,
  });
} catch (error) {
  missingRecomputeError = String(error);
}

let missingCurrentStatsError = "";
try {
  builderModule.buildHistoryStatsWriteItems({
    wearDailyFacts: [],
    cacheUpdateFacts: [
      {
        wardrobeId: "wd_01HZZAAA",
        target: { kind: "template", id: "tp_missing_stats" },
        wearCountDelta: 1,
        lastWornAt: { mode: "max", epochMs: Date.UTC(2026, 0, 7, 0, 0, 0, 0) },
      },
    ],
  });
} catch (error) {
  missingCurrentStatsError = String(error);
}

const conditionExpressions = [...createItems, ...deleteItems]
  .flatMap((item) => item?.Update?.ConditionExpression ? [item.Update.ConditionExpression] : []);

const checks = [
  {
    name: "create 用に wearDaily + cache 更新の TransactWriteItems を組み立てられる",
    ok:
      createItems.length === 4
      && createItems[0]?.Update?.Key?.PK === "W#wd_01HZZAAA#COUNT#TPL#tp_01HZZBBB"
      && createItems[1]?.Update?.Key?.PK === "W#wd_01HZZAAA#COUNT#CLOTH#cl_01HZZCCC"
      && createItems[2]?.Update?.Key?.SK === "TPL#tp_01HZZBBB"
      && createItems[3]?.Update?.Key?.SK === "CLOTH#cl_01HZZCCC",
    detail: createItems,
  },
  {
    name: "create 用 wearDaily 更新式は count 増分で、条件式に算術演算を含めない",
    ok:
      createItems[0]?.Update?.UpdateExpression === "SET #count = if_not_exists(#count, :zero) + :countDelta"
      && createItems[0]?.Update?.ConditionExpression === undefined
      && createItems[0]?.Update?.ExpressionAttributeValues?.[":countDelta"] === 1,
    detail: createItems[0],
  },
  {
    name: "create 用 cache 更新は現在 wearCount を条件に統計カラムを同期できる",
    ok:
      createItems[2]?.Update?.ConditionExpression ===
        "attribute_exists(PK) AND (attribute_not_exists(wearCount) OR wearCount = :currentWearCount)"
      && createItems[2]?.Update?.ExpressionAttributeValues?.[":requiredWearCount"] === undefined
      && createItems[2]?.Update?.ExpressionAttributeValues?.[":currentWearCount"] === 6
      && createItems[2]?.Update?.ExpressionAttributeValues?.[":wearCount"] === 7
      && createItems[2]?.Update?.UpdateExpression.includes("wearCountSk = :wearCountSk")
      && createItems[2]?.Update?.UpdateExpression.includes("lastWornAtSk = :lastWornAtSk")
      && createItems[3]?.Update?.ExpressionAttributeValues?.[":currentWearCount"] === 11
      && createItems[3]?.Update?.ExpressionAttributeValues?.[":wearCount"] === 12
      && createItems[3]?.Update?.UpdateExpression.includes("wearCountSk = :wearCountSk")
      && createItems[3]?.Update?.UpdateExpression.includes("lastWornAtSk = :lastWornAtSk"),
    detail: createItems[2],
  },
  {
    name: "create 用 cache 更新は wearCount/lastWornAt と同じ値で GSI sort key を更新できる",
    ok:
      createItems[2]?.Update?.ExpressionAttributeValues?.[":wearCountSk"] === "WEAR#0000000007#tp_01HZZBBB"
      && createItems[2]?.Update?.ExpressionAttributeValues?.[":lastWornAtSk"] ===
        `LASTWORN#${Date.UTC(2026, 0, 7, 0, 0, 0, 0)}#tp_01HZZBBB`
      && createItems[3]?.Update?.ExpressionAttributeValues?.[":wearCountSk"] === "WEAR#0000000012#cl_01HZZCCC"
      && createItems[3]?.Update?.ExpressionAttributeValues?.[":lastWornAtSk"] ===
        `LASTWORN#${Date.UTC(2026, 0, 7, 0, 0, 0, 0)}#cl_01HZZCCC`,
    detail: createItems,
  },
  {
    name: "delete 用は減算ガードと再計算済み lastWornAt を同時に反映できる",
    ok:
      deleteItems.length === 2
      && deleteItems[0]?.Update?.ConditionExpression === "attribute_exists(#count) AND #count >= :requiredCount"
      && deleteItems[0]?.Update?.ExpressionAttributeValues?.[":requiredCount"] === 1
      && deleteItems[1]?.Update?.ConditionExpression ===
        "attribute_exists(PK) AND (attribute_not_exists(wearCount) OR wearCount = :currentWearCount) AND wearCount >= :requiredWearCount"
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":requiredWearCount"] === 1
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":currentWearCount"] === 11
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":wearCount"] === 10
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":lastWornAt"] === Date.UTC(2026, 0, 2, 0, 0, 0, 0)
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":wearCountSk"] === "WEAR#0000000010#cl_01HZZCCC"
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":lastWornAtSk"] ===
        `LASTWORN#${Date.UTC(2026, 0, 2, 0, 0, 0, 0)}#cl_01HZZCCC`,
    detail: deleteItems,
  },
  {
    name: "生成される ConditionExpression に算術演算子を含めない",
    ok: conditionExpressions.every((expression) => !expression.includes(" + ") && !expression.includes(" - ")),
    detail: conditionExpressions,
  },
  {
    name: "recompute モードで resolver 未指定の場合は明示的に失敗する",
    ok: missingRecomputeError.includes("lastWornAt recompute result is required"),
    detail: missingRecomputeError,
  },
  {
    name: "current stats resolver 未指定の場合は明示的に失敗する",
    ok: missingCurrentStatsError.includes("current stats is required"),
    detail: missingCurrentStatsError,
  },
  {
    name: "buildItems.ts が BE-MS5-T05 で必要な helper を export している",
    ok: builderSource.includes("export const buildHistoryStatsWriteItems"),
    detail: builderSource,
  },
  {
    name: "package script と CI に BE-MS5-T05 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-transact-builder": "node --import tsx/esm scripts/check-history-stats-write-transact-builder-spec.mjs"',
      )
      && packageJson.includes("pnpm run test:history-stats-write-transact-builder")
      && ciSource.includes("pnpm --filter api test:history-stats-write-transact-builder"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T05 history/stats_write transact builder spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T05 history/stats_write transact builder spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
