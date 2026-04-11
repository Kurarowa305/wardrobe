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
  });
} catch (error) {
  missingRecomputeError = String(error);
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
    name: "create 用 cache 更新は item 存在確認のみで加算できる",
    ok:
      createItems[2]?.Update?.ConditionExpression === "attribute_exists(PK)"
      && createItems[2]?.Update?.ExpressionAttributeValues?.[":requiredWearCount"] === undefined,
    detail: createItems[2],
  },
  {
    name: "delete 用は減算ガードと再計算済み lastWornAt を同時に反映できる",
    ok:
      deleteItems.length === 2
      && deleteItems[0]?.Update?.ConditionExpression === "attribute_exists(#count) AND #count >= :requiredCount"
      && deleteItems[0]?.Update?.ExpressionAttributeValues?.[":requiredCount"] === 1
      && deleteItems[1]?.Update?.ConditionExpression === "attribute_exists(PK) AND wearCount >= :requiredWearCount"
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":requiredWearCount"] === 1
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":wearCountDelta"] === -1
      && deleteItems[1]?.Update?.ExpressionAttributeValues?.[":lastWornAt"] === Date.UTC(2026, 0, 2, 0, 0, 0, 0),
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
