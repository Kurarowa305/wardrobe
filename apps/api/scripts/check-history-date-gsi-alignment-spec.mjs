import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/history/repo/historyRepo.ts");
const keysModulePath = path.join(root, "src/domains/history/repo/historyKeys.ts");
const usecaseModulePath = path.join(root, "src/domains/history/usecases/historyUsecase.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const cursorModulePath = path.join(root, "src/core/cursor/index.ts");
const dynamodbTfPath = path.join(root, "../../infra/terraform/app/dynamodb.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const testDesignPath = path.join(root, "../../design/テスト設計/履歴一覧取得失敗_HistoryByDateキー名整合テスト設計.md");

const repoSource = readFileSync(repoModulePath, "utf8");
const keysSource = readFileSync(keysModulePath, "utf8");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const dynamodbTf = readFileSync(dynamodbTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const testDesignSource = readFileSync(testDesignPath, "utf8");

const { buildHistoryItem, createHistoryRepo } = await import(repoModulePath);
const { createHistoryUsecase } = await import(usecaseModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);
const { encodeCursor } = await import(cursorModulePath);

const mockDocumentClient = { send: async () => ({}) };
const history = {
  wardrobeId: "wd_001",
  historyId: "hs_001",
  date: "20260105",
  templateId: null,
  clothingIds: ["cl_001"],
  createdAt: 1736035200000,
};

const historyItem = buildHistoryItem(history);
const repoClient = createHistoryRepo(createDynamoDbClient({
  endpoint: "http://localhost:8000",
  tableName: "SpecTable",
  documentClient: mockDocumentClient,
}));
const repoListResult = await repoClient.list({
  wardrobeId: "wd_001",
  from: "20260101",
  to: "20260131",
  order: "asc",
  limit: 10,
  exclusiveStartKey: {
    PK: "W#wd_001#HIST",
    SK: "HIST#hs_000",
    historyDateSk: "DATE#20260101#hs_000",
  },
});

const listCalls = [];
const usecase = createHistoryUsecase({
  repo: {
    async list(input) {
      listCalls.push(input);
      return {
        Items: [],
        LastEvaluatedKey: null,
      };
    },
    async get() {
      return { Item: null };
    },
  },
  historyDetailsResolver: {
    async resolveMany() {
      return [];
    },
    async resolveOne() {
      return {
        historyId: "hs_unused",
        date: "20260101",
        templateName: null,
        clothingItems: [],
      };
    },
  },
});

const cursor = encodeCursor({
  resource: "history-list",
  order: "asc",
  filters: {
    from: "20260101",
    to: "20260131",
  },
  position: {
    PK: "W#wd_001#HIST",
    SK: "HIST#hs_000",
    historyDateSk: "DATE#20260101#hs_000",
  },
});

await usecase.list({
  wardrobeId: "wd_001",
  params: {
    from: "20260101",
    to: "20260131",
    order: "asc",
    limit: 10,
    cursor,
  },
});

const checks = [
  {
    name: "history item writes historyDateSk for HistoryByDate GSI",
    ok:
      historyItem.PK === "W#wd_001#HIST" &&
      historyItem.SK === "HIST#hs_001" &&
      historyItem.historyDateSk === "DATE#20260105#hs_001" &&
      keysSource.includes("historyDateSk: buildHistoryDateSk"),
    detail: historyItem,
  },
  {
    name: "history repo queries HistoryByDate with historyDateSk key condition and cursor",
    ok:
      repoListResult.operation === "Query" &&
      repoListResult.request.input.IndexName === "HistoryByDate" &&
      repoListResult.request.input.KeyConditionExpression
        === "#PK = :PK AND #historyDateSk BETWEEN :fromDateSk AND :toDateSk" &&
      repoListResult.request.input.ExpressionAttributeNames["#historyDateSk"] === "historyDateSk" &&
      repoListResult.request.input.ExclusiveStartKey.historyDateSk === "DATE#20260101#hs_000" &&
      repoSource.includes('historyDateSk: string;'),
    detail: repoListResult,
  },
  {
    name: "history list usecase cursor position uses historyDateSk",
    ok:
      listCalls.length === 1 &&
      listCalls[0]?.exclusiveStartKey?.historyDateSk === "DATE#20260101#hs_000" &&
      usecaseSource.includes("historyDateSk: string;") &&
      usecaseSource.includes("typeof position.historyDateSk !== \"string\""),
    detail: { listCalls },
  },
  {
    name: "terraform HistoryByDate GSI range key matches historyDateSk",
    ok:
      dynamodbTf.includes('name            = "HistoryByDate"') &&
      dynamodbTf.includes('range_key       = "historyDateSk"'),
    detail: dynamodbTf,
  },
  {
    name: "package script, CI, and test design are wired for the regression test",
    ok:
      packageJson.includes('"test:history-date-gsi-alignment": "node --import tsx/esm scripts/check-history-date-gsi-alignment-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-date-gsi-alignment") &&
      ciSource.includes("pnpm --filter api test:history-date-gsi-alignment") &&
      testDesignSource.includes("check-history-date-gsi-alignment-spec.mjs"),
    detail: { packageJson, ciSource, testDesignSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history date GSI alignment spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("history date GSI alignment spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
