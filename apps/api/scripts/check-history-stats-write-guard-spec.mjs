import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const guardPath = path.join(root, "src/domains/history/stats_write/transact/guard.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const guardModule = await import(guardPath);
const guardSource = readFileSync(guardPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

let withinLimitError = "";
try {
  guardModule.assertHistoryStatsWriteWithinLimit({ itemCount: 25 });
} catch (error) {
  withinLimitError = String(error);
}

let exceedLimitError = "";
try {
  guardModule.assertHistoryStatsWriteWithinLimit({ itemCount: 26 });
} catch (error) {
  exceedLimitError = String(error);
}

let customLimitError = "";
try {
  guardModule.assertHistoryStatsWriteWithinLimit({ itemCount: 3, limit: 2 });
} catch (error) {
  customLimitError = String(error);
}

let itemsLimitError = "";
try {
  guardModule.assertHistoryStatsWriteItemsWithinLimit(new Array(26).fill({}));
} catch (error) {
  itemsLimitError = String(error);
}

const checks = [
  {
    name: "TransactWrite 上限が 25 件で公開される",
    ok: guardModule.HISTORY_STATS_WRITE_LIMIT === 25,
    detail: guardModule.HISTORY_STATS_WRITE_LIMIT,
  },
  {
    name: "上限以内（25 件）では失敗しない",
    ok: withinLimitError === "",
    detail: withinLimitError,
  },
  {
    name: "上限超過（26 件）で明示的に失敗する",
    ok: exceedLimitError.includes("history stats write transact items exceed limit: 26 > 25"),
    detail: exceedLimitError,
  },
  {
    name: "custom limit 指定時にも同じ guard を適用できる",
    ok: customLimitError.includes("history stats write transact items exceed limit: 3 > 2"),
    detail: customLimitError,
  },
  {
    name: "items 配列向け helper でも上限超過を検知できる",
    ok: itemsLimitError.includes("history stats write transact items exceed limit: 26 > 25"),
    detail: itemsLimitError,
  },
  {
    name: "guard.ts が BE-MS5-T06 で必要な helper を export している",
    ok:
      guardSource.includes("export const HISTORY_STATS_WRITE_LIMIT = 25") &&
      guardSource.includes("export const assertHistoryStatsWriteWithinLimit") &&
      guardSource.includes("export const assertHistoryStatsWriteItemsWithinLimit"),
    detail: guardSource,
  },
  {
    name: "package script と CI に BE-MS5-T06 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-guard": "node --import tsx/esm scripts/check-history-stats-write-guard-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-stats-write-guard") &&
      ciSource.includes("pnpm --filter api test:history-stats-write-guard"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T06 history/stats_write guard spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T06 history/stats_write guard spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
