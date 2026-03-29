import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const clothingRepoPath = path.join(root, "src/domains/history/stats_write/repo/clothingStatsRepo.ts");
const templateRepoPath = path.join(root, "src/domains/history/stats_write/repo/templateStatsRepo.ts");
const dynamoPath = path.join(root, "src/clients/dynamodb.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const clothingRepoSource = readFileSync(clothingRepoPath, "utf8");
const templateRepoSource = readFileSync(templateRepoPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const clothingRepoModule = await import(clothingRepoPath);
const templateRepoModule = await import(templateRepoPath);
const { createDynamoDbClient } = await import(dynamoPath);
const mockDocumentClient = { send: async () => ({}) };

const clothingSortKeys = clothingRepoModule.buildClothingStatsSortKeys({
  clothingId: "cl_01HZZCCC",
  wearCount: 12,
  lastWornAt: Date.UTC(2026, 0, 7, 0, 0, 0, 0),
});

const templateSortKeys = templateRepoModule.buildTemplateStatsSortKeys({
  templateId: "tp_01HZZBBB",
  wearCount: 7,
  lastWornAt: Date.UTC(2026, 0, 8, 0, 0, 0, 0),
});

const client = createDynamoDbClient({
  endpoint: "http://localhost:8000",
  tableName: "SpecTable",
  documentClient: mockDocumentClient,
});

const clothingRepo = clothingRepoModule.createClothingStatsRepo(client);
const clothingUpdateResult = await clothingRepo.updateStats({
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZCCC",
  wearCount: 12,
  lastWornAt: Date.UTC(2026, 0, 7, 0, 0, 0, 0),
});

const templateRepo = templateRepoModule.createTemplateStatsRepo(client);
const templateUpdateResult = await templateRepo.updateStats({
  wardrobeId: "wd_01HZZAAA",
  templateId: "tp_01HZZBBB",
  wearCount: 7,
  lastWornAt: Date.UTC(2026, 0, 8, 0, 0, 0, 0),
});

const checks = [
  {
    name: "clothing stats sort key helper が wearCountSk / lastWornAtSk を生成できる",
    ok:
      clothingSortKeys.wearCountSk === "WEAR#0000000012#cl_01HZZCCC"
      && clothingSortKeys.lastWornAtSk === `LASTWORN#${Date.UTC(2026, 0, 7, 0, 0, 0, 0)}#cl_01HZZCCC`,
    detail: clothingSortKeys,
  },
  {
    name: "template stats sort key helper が wearCountSk / lastWornAtSk を生成できる",
    ok:
      templateSortKeys.wearCountSk === "WEAR#0000000007#tp_01HZZBBB"
      && templateSortKeys.lastWornAtSk === `LASTWORN#${Date.UTC(2026, 0, 8, 0, 0, 0, 0)}#tp_01HZZBBB`,
    detail: templateSortKeys,
  },
  {
    name: "clothingStatsRepo.updateStats は base key と統計カラムを直接更新できる",
    ok:
      clothingUpdateResult.operation === "UpdateItem"
      && clothingUpdateResult.request.input.Key.PK === "W#wd_01HZZAAA#CLOTH"
      && clothingUpdateResult.request.input.Key.SK === "CLOTH#cl_01HZZCCC"
      && clothingUpdateResult.request.input.UpdateExpression.includes("wearCount = :wearCount")
      && clothingUpdateResult.request.input.UpdateExpression.includes("lastWornAt = :lastWornAt")
      && clothingUpdateResult.request.input.UpdateExpression.includes("wearCountSk = :wearCountSk")
      && clothingUpdateResult.request.input.UpdateExpression.includes("lastWornAtSk = :lastWornAtSk")
      && clothingUpdateResult.request.input.ConditionExpression === "attribute_exists(PK)"
      && clothingUpdateResult.request.input.ReturnValues === "ALL_NEW",
    detail: clothingUpdateResult,
  },
  {
    name: "templateStatsRepo.updateStats は base key と統計カラムを直接更新できる",
    ok:
      templateUpdateResult.operation === "UpdateItem"
      && templateUpdateResult.request.input.Key.PK === "W#wd_01HZZAAA#TPL"
      && templateUpdateResult.request.input.Key.SK === "TPL#tp_01HZZBBB"
      && templateUpdateResult.request.input.UpdateExpression.includes("wearCount = :wearCount")
      && templateUpdateResult.request.input.UpdateExpression.includes("lastWornAt = :lastWornAt")
      && templateUpdateResult.request.input.UpdateExpression.includes("wearCountSk = :wearCountSk")
      && templateUpdateResult.request.input.UpdateExpression.includes("lastWornAtSk = :lastWornAtSk")
      && templateUpdateResult.request.input.ConditionExpression === "attribute_exists(PK)"
      && templateUpdateResult.request.input.ReturnValues === "ALL_NEW",
    detail: templateUpdateResult,
  },
  {
    name: "repo source が BE-MS5-T07 で必要な helper と factory を export している",
    ok:
      clothingRepoSource.includes("export function buildClothingStatsSortKeys")
      && clothingRepoSource.includes("export function createClothingStatsRepo")
      && templateRepoSource.includes("export function buildTemplateStatsSortKeys")
      && templateRepoSource.includes("export function createTemplateStatsRepo"),
    detail: { clothingRepoSource, templateRepoSource },
  },
  {
    name: "package script と CI に BE-MS5-T07 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-stats-repo": "node --import tsx/esm scripts/check-history-stats-write-stats-repo-spec.mjs"',
      )
      && packageJson.includes("pnpm run test:history-stats-write-stats-repo")
      && ciSource.includes("pnpm --filter api test:history-stats-write-stats-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T07 clothingStatsRepo / templateStatsRepo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T07 clothingStatsRepo / templateStatsRepo spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
