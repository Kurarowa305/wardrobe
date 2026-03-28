import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const dailyPath = path.join(root, "src/domains/history/stats_write/aggregations/daily.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const dailyModule = await import(dailyPath);
const dailySource = readFileSync(dailyPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const createCommand = {
  mode: "create",
  history: {
    wardrobeId: "wd_01HZZAAA",
    historyId: "hs_01HZZAAA",
    date: "20260102",
    templateId: "tp_01HZZBBB",
    clothingIds: ["cl_01", "cl_02", "cl_01"],
    createdAt: 1735600000000,
  },
};

const deleteCommand = {
  mode: "delete",
  history: {
    wardrobeId: "wd_01HZZAAA",
    historyId: "hs_01HZZCCC",
    date: "20260103",
    templateId: null,
    clothingIds: ["cl_01", "cl_03"],
    createdAt: 1735686400000,
  },
};

const createTargets = dailyModule.resolveDailyStatsTargets(createCommand);
const createWearDaily = dailyModule.buildWearDailyFacts(createCommand);
const createCacheUpdates = dailyModule.buildDailyStatsCacheUpdateFacts(createCommand);
const deleteWearDaily = dailyModule.buildWearDailyFacts(deleteCommand);
const deleteCacheUpdates = dailyModule.buildDailyStatsCacheUpdateFacts(deleteCommand);

const checks = [
  {
    name: "create 時に template + clothing 一覧を日次集計対象として抽出できる（重複服は除外）",
    ok:
      createTargets.length === 3 &&
      createTargets[0]?.kind === "template" &&
      createTargets[0]?.id === "tp_01HZZBBB" &&
      createTargets[1]?.kind === "clothing" &&
      createTargets[1]?.id === "cl_01" &&
      createTargets[2]?.id === "cl_02",
    detail: createTargets,
  },
  {
    name: "create 時の wear daily facts が +1 で構築される",
    ok:
      createWearDaily.length === 3 &&
      createWearDaily.every((fact) => fact.wardrobeId === "wd_01HZZAAA") &&
      createWearDaily.every((fact) => fact.date === "20260102") &&
      createWearDaily.every((fact) => fact.count === 1),
    detail: createWearDaily,
  },
  {
    name: "delete 時の wear daily facts が -1 で構築される（template なし）",
    ok:
      deleteWearDaily.length === 2 &&
      deleteWearDaily.every((fact) => fact.target.kind === "clothing") &&
      deleteWearDaily.every((fact) => fact.count === -1),
    detail: deleteWearDaily,
  },
  {
    name: "create 時の cache 更新方針が wearCount 増分 + lastWornAt=max(date) になる",
    ok:
      createCacheUpdates.length === 3 &&
      createCacheUpdates.every((fact) => fact.wearCountDelta === 1) &&
      createCacheUpdates.every((fact) => fact.lastWornAt.mode === "max") &&
      createCacheUpdates.every((fact) => fact.lastWornAt.epochMs === 1767312000000),
    detail: createCacheUpdates,
  },
  {
    name: "delete 時の cache 更新方針が wearCount 減分 + lastWornAt 再計算になる",
    ok:
      deleteCacheUpdates.length === 2 &&
      deleteCacheUpdates.every((fact) => fact.wearCountDelta === -1) &&
      deleteCacheUpdates.every((fact) => fact.lastWornAt.mode === "recompute"),
    detail: deleteCacheUpdates,
  },
  {
    name: "daily.ts が BE-MS5-T03 で必要な helper を export している",
    ok:
      dailySource.includes("export const resolveDailyStatsTargets") &&
      dailySource.includes("export const buildWearDailyFacts") &&
      dailySource.includes("export const buildDailyStatsCacheUpdateFacts"),
    detail: dailySource,
  },
  {
    name: "package script と CI に BE-MS5-T03 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-daily": "node --import tsx/esm scripts/check-history-stats-write-daily-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-stats-write-daily") &&
      ciSource.includes("pnpm --filter api test:history-stats-write-daily"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T03 history/stats_write daily aggregation spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T03 history/stats_write daily aggregation spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
