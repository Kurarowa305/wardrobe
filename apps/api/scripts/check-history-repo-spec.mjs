import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/history/repo/historyRepo.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const repo = await import(repoModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);

const entity = {
  wardrobeId: "wd_01HZZAAA",
  historyId: "hs_01HZZBBB",
  date: "20260101",
  templateId: "tpl_01HZZCCC",
  clothingIds: ["cl_01", "cl_02"],
  createdAt: 1735690000123,
};

const item = repo.buildHistoryItem(entity);
const dateRangeDefault = repo.buildHistoryDateRange({});
const dateRangeFiltered = repo.buildHistoryDateRange({ from: "20251201", to: "20251231" });
const partitionPk = repo.buildHistoryPartitionKey({ wardrobeId: entity.wardrobeId });
const repoClient = repo.createHistoryRepo(createDynamoDbClient({ endpoint: "http://localhost:8000", tableName: "SpecTable" }));
const getResult = await repoClient.get({ wardrobeId: entity.wardrobeId, historyId: entity.historyId });
const listResult = await repoClient.list({
  wardrobeId: entity.wardrobeId,
  from: "20251201",
  to: "20251231",
  order: "desc",
  limit: 15,
  exclusiveStartKey: { PK: item.PK, SK: item.SK, dateSk: item.dateSk },
});
const deleteResult = await repoClient.delete({ wardrobeId: entity.wardrobeId, historyId: entity.historyId });

const checks = [
  {
    name: "buildHistoryItem adds base and date index keys to history entity",
    ok:
      item.PK === "W#wd_01HZZAAA#HIST" &&
      item.SK === "HIST#hs_01HZZBBB" &&
      item.dateSk === "DATE#20260101#hs_01HZZBBB",
    detail: item,
  },
  {
    name: "buildHistoryDateRange defaults to full range and supports from/to filters",
    ok:
      dateRangeDefault.fromDateSk === "DATE#00000000#" &&
      dateRangeDefault.toDateSk === "DATE#99999999#~" &&
      dateRangeFiltered.fromDateSk === "DATE#20251201#" &&
      dateRangeFiltered.toDateSk === "DATE#20251231#~",
    detail: { dateRangeDefault, dateRangeFiltered },
  },
  {
    name: "buildHistoryPartitionKey returns W#<wardrobeId>#HIST",
    ok: partitionPk === "W#wd_01HZZAAA#HIST",
    detail: partitionPk,
  },
  {
    name: "repo get performs consistent lookup on history base key",
    ok:
      getResult.operation === "GetItem" &&
      getResult.request.input.Key.PK === "W#wd_01HZZAAA#HIST" &&
      getResult.request.input.Key.SK === "HIST#hs_01HZZBBB" &&
      getResult.request.input.ConsistentRead === true,
    detail: getResult,
  },
  {
    name: "repo list queries HistoryByDate with date range, order, limit, and cursor key",
    ok:
      listResult.operation === "Query" &&
      listResult.request.input.IndexName === "HistoryByDate" &&
      listResult.request.input.KeyConditionExpression === "#PK = :PK AND #dateSk BETWEEN :fromDateSk AND :toDateSk" &&
      listResult.request.input.ExpressionAttributeValues[":PK"] === "W#wd_01HZZAAA#HIST" &&
      listResult.request.input.ExpressionAttributeValues[":fromDateSk"] === "DATE#20251201#" &&
      listResult.request.input.ExpressionAttributeValues[":toDateSk"] === "DATE#20251231#~" &&
      listResult.request.input.ScanIndexForward === false &&
      listResult.request.input.Limit === 15 &&
      listResult.request.input.ExclusiveStartKey.dateSk === "DATE#20260101#hs_01HZZBBB",
    detail: listResult,
  },
  {
    name: "repo delete builds physical deletion transaction with existence guard",
    ok:
      deleteResult.operation === "TransactWriteItems" &&
      Array.isArray(deleteResult.request.input.TransactItems) &&
      deleteResult.request.input.TransactItems.length === 1 &&
      deleteResult.request.input.TransactItems[0].Delete?.Key.PK === "W#wd_01HZZAAA#HIST" &&
      deleteResult.request.input.TransactItems[0].Delete?.Key.SK === "HIST#hs_01HZZBBB" &&
      deleteResult.request.input.TransactItems[0].Delete?.ConditionExpression === "attribute_exists(PK)",
    detail: deleteResult,
  },
  {
    name: "source exports history repo helpers plus package script and CI wiring",
    ok:
      source.includes("export function buildHistoryItem") &&
      source.includes("export function buildHistoryDateRange") &&
      source.includes("export function buildHistoryPartitionKey") &&
      source.includes("export function createHistoryRepo") &&
      packageJson.includes('"test:history-repo": "node --import tsx/esm scripts/check-history-repo-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-repo") &&
      ciSource.includes("pnpm --filter api test:history-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T03 history repo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T03 history repo spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
