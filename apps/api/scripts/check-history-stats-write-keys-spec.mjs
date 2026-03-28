import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const keysPath = path.join(root, "src/domains/history/stats_write/keys.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const keysModule = await import(keysPath);
const keysSource = readFileSync(keysPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const clothingTarget = {
  kind: "clothing",
  id: "cl_01HZZBBB",
};

const templateTarget = {
  kind: "template",
  id: "tp_01HZZCCC",
};

const clothingPk = keysModule.buildWearDailyPartitionKey({
  wardrobeId: "wd_01HZZAAA",
  target: clothingTarget,
});

const templatePk = keysModule.buildWearDailyPartitionKey({
  wardrobeId: "wd_01HZZAAA",
  target: templateTarget,
});

const dateSk = keysModule.buildHistoryStatsDateKey({
  date: "20260102",
});

const templateKey = keysModule.buildWearDailyKey({
  wardrobeId: "wd_01HZZAAA",
  target: templateTarget,
  date: "20260103",
});

const checks = [
  {
    name: "DATE#yyyymmdd 形式の daily counter sort key を生成できる",
    ok: dateSk === "DATE#20260102",
    detail: dateSk,
  },
  {
    name: "clothing daily counter の partition key を生成できる",
    ok: clothingPk === "W#wd_01HZZAAA#COUNT#CLOTH#cl_01HZZBBB",
    detail: clothingPk,
  },
  {
    name: "template daily counter の partition key を生成できる",
    ok: templatePk === "W#wd_01HZZAAA#COUNT#TPL#tp_01HZZCCC",
    detail: templatePk,
  },
  {
    name: "daily counter key helper が PK/SK を組み立てられる",
    ok:
      templateKey.PK === "W#wd_01HZZAAA#COUNT#TPL#tp_01HZZCCC" &&
      templateKey.SK === "DATE#20260103",
    detail: templateKey,
  },
  {
    name: "keys.ts が主要 key helper を export している",
    ok:
      keysSource.includes("export const buildHistoryStatsDateKey") &&
      keysSource.includes("export const buildWearDailyPartitionKey") &&
      keysSource.includes("export const buildWearDailyKey"),
    detail: keysSource,
  },
  {
    name: "package script と CI に BE-MS5-T02 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-keys": "node --import tsx/esm scripts/check-history-stats-write-keys-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-stats-write-keys") &&
      ciSource.includes("pnpm --filter api test:history-stats-write-keys"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T02 history/stats_write keys spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T02 history/stats_write keys spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
