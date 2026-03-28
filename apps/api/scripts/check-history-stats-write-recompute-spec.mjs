import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const recomputePath = path.join(root, "src/domains/history/stats_write/recompute/lastWornAt.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const recomputeModule = await import(recomputePath);
const recomputeSource = readFileSync(recomputePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const unchangedLastWornAt = await recomputeModule.recomputeLastWornAt({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "clothing",
    id: "cl_01HZZBBB",
  },
  deletedDate: "20260105",
  currentLastWornAt: Date.UTC(2026, 0, 7, 0, 0, 0, 0),
  findLatestBeforeDate: async () => {
    throw new Error("findLatestBeforeDate should not be called when lastWornAt is unaffected");
  },
});

const recomputedToPreviousDate = await recomputeModule.recomputeLastWornAt({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "template",
    id: "tp_01HZZCCC",
  },
  deletedDate: "20260107",
  currentLastWornAt: Date.UTC(2026, 0, 7, 0, 0, 0, 0),
  findLatestBeforeDate: async (input) => {
    if (input.beforeDate !== "20260107") {
      throw new Error(`unexpected beforeDate: ${input.beforeDate}`);
    }

    return {
      date: "20260103",
    };
  },
});

const recomputedToZero = await recomputeModule.recomputeLastWornAt({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "clothing",
    id: "cl_01HZZDDD",
  },
  deletedDate: "20260107",
  currentLastWornAt: Date.UTC(2026, 0, 7, 0, 0, 0, 0),
  findLatestBeforeDate: async () => null,
});

const recomputeCursor = recomputeModule.buildRecomputeCursor("20260107");

const checks = [
  {
    name: "削除日が lastWornAt と不一致の場合は再計算せず既存値を返す",
    ok: unchangedLastWornAt === Date.UTC(2026, 0, 7, 0, 0, 0, 0),
    detail: unchangedLastWornAt,
  },
  {
    name: "最新日削除時に次点日を Query して epoch ms に再計算できる",
    ok: recomputedToPreviousDate === Date.UTC(2026, 0, 3, 0, 0, 0, 0),
    detail: recomputedToPreviousDate,
  },
  {
    name: "次点日が存在しない場合は lastWornAt を 0 に落とせる",
    ok: recomputedToZero === 0,
    detail: recomputedToZero,
  },
  {
    name: "再計算 Query 用の DATE カーソルを組み立てられる",
    ok: recomputeCursor === "DATE#20260107",
    detail: recomputeCursor,
  },
  {
    name: "lastWornAt.ts が BE-MS5-T04 で必要な helper を export している",
    ok:
      recomputeSource.includes("export const buildRecomputeCursor") &&
      recomputeSource.includes("export const recomputeLastWornAt"),
    detail: recomputeSource,
  },
  {
    name: "package script と CI に BE-MS5-T04 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-recompute": "node --import tsx/esm scripts/check-history-stats-write-recompute-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-stats-write-recompute") &&
      ciSource.includes("pnpm --filter api test:history-stats-write-recompute"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T04 history/stats_write recompute spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T04 history/stats_write recompute spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
