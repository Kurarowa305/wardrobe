import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoPath = path.join(root, "src/domains/history/stats_write/repo/wearDailyQueryRepo.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const repoSource = readFileSync(repoPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const repoModule = await import(repoPath);

const queryCalls = [];
const fakeClient = {
  async query(input) {
    queryCalls.push(input);

    return {
      Items: [
        {
          PK: "W#wd_01HZZAAA#COUNT#CLOTH#cl_01HZZBBB",
          SK: "DATE#20260105",
        },
      ],
    };
  },
};

const repo = repoModule.createWearDailyQueryRepo(fakeClient);
const latest = await repo.findLatestBeforeDate({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "clothing",
    id: "cl_01HZZBBB",
  },
  beforeDate: "20260107",
});

const noHitRepo = repoModule.createWearDailyQueryRepo({
  async query() {
    return { Items: [] };
  },
});

const noHit = await noHitRepo.findLatestBeforeDate({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "template",
    id: "tp_01HZZCCC",
  },
  beforeDate: "20260107",
});

const invalidSkRepo = repoModule.createWearDailyQueryRepo({
  async query() {
    return { Items: [{ SK: "INVALID#20260101" }] };
  },
});

const invalidSkResult = await invalidSkRepo.findLatestBeforeDate({
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "template",
    id: "tp_01HZZCCC",
  },
  beforeDate: "20260107",
});

const extractedDate = repoModule.extractDateFromWearDailySk("DATE#20260108");

const checks = [
  {
    name: "降順 Query で beforeDate 未満の最新1件を検索する入力を組み立てられる",
    ok:
      queryCalls.length === 1
      && queryCalls[0]?.KeyConditionExpression === "#PK = :PK AND #SK < :beforeDateSk"
      && queryCalls[0]?.ExpressionAttributeValues?.[":PK"] === "W#wd_01HZZAAA#COUNT#CLOTH#cl_01HZZBBB"
      && queryCalls[0]?.ExpressionAttributeValues?.[":beforeDateSk"] === "DATE#20260107"
      && queryCalls[0]?.ScanIndexForward === false
      && queryCalls[0]?.Limit === 1,
    detail: queryCalls[0],
  },
  {
    name: "Query 結果1件目の SK から yyyymmdd を取り出して返せる",
    ok: latest?.date === "20260105",
    detail: latest,
  },
  {
    name: "該当データが存在しない場合は null を返す",
    ok: noHit === null,
    detail: noHit,
  },
  {
    name: "SK 形式が DATE#yyyymmdd でない場合は null を返す",
    ok: invalidSkResult === null,
    detail: invalidSkResult,
  },
  {
    name: "SK helper が DATE プレフィックスを取り除いた日付を返す",
    ok: extractedDate === "20260108",
    detail: extractedDate,
  },
  {
    name: "wearDailyQueryRepo.ts が BE-MS5-T08 で必要な helper と factory を export している",
    ok:
      repoSource.includes("export const extractDateFromWearDailySk")
      && repoSource.includes("export function createWearDailyQueryRepo"),
    detail: repoSource,
  },
  {
    name: "package script と CI に BE-MS5-T08 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-wear-daily-query-repo": "node --import tsx/esm scripts/check-history-stats-write-wear-daily-query-repo-spec.mjs"',
      )
      && packageJson.includes("pnpm run test:history-stats-write-wear-daily-query-repo")
      && ciSource.includes("pnpm --filter api test:history-stats-write-wear-daily-query-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T08 wearDailyQueryRepo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T08 wearDailyQueryRepo spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
