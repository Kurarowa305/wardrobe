import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const requiredPaths = [
  "src/entry/lambda",
  "src/entry/local",
  "src/domains/wardrobe",
  "src/domains/clothing",
  "src/domains/template",
  "src/domains/history",
  "src/domains/history/stats_write",
  "src/domains/presign",
  "src/core/errors",
  "src/core/cursor",
  "src/core/logging",
  "src/core/validation",
  "src/core/response",
  "src/clients",
  "src/clients/dynamodb.ts",
  "src/clients/s3.ts",
  "src/config/env.ts",
  "src/entry/lambda/wardrobe_server.ts",
  "src/entry/lambda/clothing_server.ts",
  "src/entry/lambda/template_server.ts",
  "src/entry/lambda/history_server.ts",
  "src/entry/lambda/stats_server.ts",
  "src/entry/lambda/presign_server.ts",
  "src/entry/local/server.ts",
  "src/entry/local/router.ts",
  "src/domains/history/handlers/createHistoryHandler.ts",
  "src/domains/history/handlers/deleteHistoryHandler.ts",
  "src/domains/history/usecases/createHistoryWithStatsWrite.ts",
  "src/domains/history/usecases/deleteHistoryWithStatsWrite.ts",
  "src/domains/history/repo/historyRepo.ts",
  "src/domains/history/stats_write/types.ts",
  "src/domains/history/stats_write/keys.ts",
  "src/domains/history/stats_write/plan.ts",
  "src/domains/history/stats_write/aggregations/daily.ts",
  "src/domains/history/stats_write/aggregations/weekly.ts",
  "src/domains/history/stats_write/aggregations/monthly.ts",
  "src/domains/history/stats_write/recompute/lastWornAt.ts",
  "src/domains/history/stats_write/recompute/wearDailyCount.ts",
  "src/domains/history/stats_write/transact/buildItems.ts",
  "src/domains/history/stats_write/transact/guard.ts",
  "src/domains/history/stats_write/repo/clothingStatsRepo.ts",
  "src/domains/history/stats_write/repo/templateStatsRepo.ts",
  "src/domains/history/stats_write/repo/wearDailyQueryRepo.ts",
];

const failures = requiredPaths.filter((target) => !fs.existsSync(path.join(root, target)));

const envSrc = fs.readFileSync(path.join(root, "src/config/env.ts"), "utf8");
const envChecks = ["TABLE_NAME", "IMAGE_PUBLIC_BASE_URL", "STORAGE_DRIVER"].filter(
  (token) => !envSrc.includes(token),
);

if (failures.length > 0 || envChecks.length > 0) {
  console.error("BE-MS0-T02 directory structure spec failed:");
  for (const failure of failures) {
    console.error(`- missing: ${failure}`);
  }
  for (const token of envChecks) {
    console.error(`- src/config/env.ts does not mention ${token}`);
  }
  process.exit(1);
}

console.log("BE-MS0-T02 directory structure spec passed");
for (const target of requiredPaths) {
  console.log(`- ${target}`);
}
