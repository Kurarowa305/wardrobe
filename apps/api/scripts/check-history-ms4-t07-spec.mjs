import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/history/repo/historyRepo.ts");
const usecaseModulePath = path.join(root, "src/domains/history/usecases/historyUsecase.ts");
const listHandlerModulePath = path.join(root, "src/domains/history/handlers/listHistoryHandler.ts");
const getHandlerModulePath = path.join(root, "src/domains/history/handlers/getHistoryHandler.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const cursorModulePath = path.join(root, "src/core/cursor/index.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const testDesignPath = path.join(root, "../../design/テスト設計/BE-MS4-T07_History参照系テスト設計.md");

const repoSource = readFileSync(repoModulePath, "utf8");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const listHandlerSource = readFileSync(listHandlerModulePath, "utf8");
const getHandlerSource = readFileSync(getHandlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const testDesignSource = readFileSync(testDesignPath, "utf8");

const { createHistoryRepo } = await import(repoModulePath);
const { createHistoryUsecase } = await import(usecaseModulePath);
const { listHistoryHandler } = await import(listHandlerModulePath);
const { getHistoryHandler } = await import(getHandlerModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);
const { encodeCursor } = await import(cursorModulePath);

const repoClient = createHistoryRepo(createDynamoDbClient({ endpoint: "http://localhost:8000", tableName: "SpecTable" }));
const repoListResult = await repoClient.list({
  wardrobeId: "wd_001",
  from: "20260101",
  to: "20260131",
  order: "asc",
  limit: 5,
  exclusiveStartKey: {
    PK: "W#wd_001#HIST",
    SK: "HIST#hs_001",
    dateSk: "DATE#20260101#hs_001",
  },
});

const listCalls = [];
const resolveManyCalls = [];

const sharedDependencies = {
  repo: {
    async list(input) {
      listCalls.push(input);
      return {
        Items: [
          {
            PK: "W#wd_001#HIST",
            SK: "HIST#hs_101",
            dateSk: "DATE#20260110#hs_101",
            wardrobeId: "wd_001",
            historyId: "hs_101",
            date: "20260110",
            templateId: "tp_001",
            clothingIds: ["cl_001", "cl_002"],
            createdAt: 1736467200000,
          },
          {
            PK: "W#wd_001#HIST",
            SK: "HIST#hs_102",
            dateSk: "DATE#20260111#hs_102",
            wardrobeId: "wd_001",
            historyId: "hs_102",
            date: "20260111",
            templateId: null,
            clothingIds: ["cl_003"],
            createdAt: 1736553600000,
          },
        ],
        LastEvaluatedKey: {
          PK: "W#wd_001#HIST",
          SK: "HIST#hs_102",
          dateSk: "DATE#20260111#hs_102",
        },
      };
    },
    async get(input) {
      if (input.historyId === "hs_101") {
        return {
          Item: {
            PK: "W#wd_001#HIST",
            SK: "HIST#hs_101",
            dateSk: "DATE#20260110#hs_101",
            wardrobeId: "wd_001",
            historyId: "hs_101",
            date: "20260110",
            templateId: "tp_001",
            clothingIds: ["cl_001", "cl_002"],
            createdAt: 1736467200000,
          },
        };
      }

      return {
        Item: {
          PK: "W#wd_001#HIST",
          SK: "HIST#hs_102",
          dateSk: "DATE#20260111#hs_102",
          wardrobeId: "wd_001",
          historyId: "hs_102",
          date: "20260111",
          templateId: null,
          clothingIds: ["cl_003"],
          createdAt: 1736553600000,
        },
      };
    },
  },
  historyDetailsResolver: {
    async resolveMany(input) {
      resolveManyCalls.push(input);
      return [
        {
          historyId: "hs_101",
          date: "20260110",
          templateName: "通勤テンプレ",
          clothingItems: [
            {
              clothingId: "cl_001",
              name: "白シャツ",
              genre: "tops",
              imageKey: "img/1.jpg",
              status: "ACTIVE",
              wearCount: 10,
              lastWornAt: 1736400000000,
            },
            {
              clothingId: "cl_002",
              name: "黒パンツ",
              genre: "bottoms",
              imageKey: null,
              status: "ACTIVE",
              wearCount: 8,
              lastWornAt: 1736300000000,
            },
          ],
        },
        {
          historyId: "hs_102",
          date: "20260111",
          templateName: null,
          clothingItems: [
            {
              clothingId: "cl_003",
              name: "グレーニット",
              genre: "tops",
              imageKey: null,
              status: "DELETED",
              wearCount: 3,
              lastWornAt: 1736200000000,
            },
          ],
        },
      ];
    },
    async resolveOne(input) {
      if (input.history.historyId === "hs_101") {
        return {
          historyId: "hs_101",
          date: "20260110",
          templateName: "通勤テンプレ",
          clothingItems: [
            {
              clothingId: "cl_001",
              name: "白シャツ",
              genre: "tops",
              imageKey: "img/1.jpg",
              status: "ACTIVE",
              wearCount: 10,
              lastWornAt: 1736400000000,
            },
          ],
        };
      }

      return {
        historyId: "hs_102",
        date: "20260111",
        templateName: null,
        clothingItems: [
          {
            clothingId: "cl_003",
            name: "グレーニット",
            genre: "tops",
            imageKey: null,
            status: "DELETED",
            wearCount: 3,
            lastWornAt: 1736200000000,
          },
        ],
      };
    },
  },
};

const usecase = createHistoryUsecase(sharedDependencies);
const validCursor = encodeCursor({
  resource: "history-list",
  order: "asc",
  filters: {
    from: "20260101",
    to: "20260131",
  },
  position: {
    PK: "W#wd_001#HIST",
    SK: "HIST#hs_001",
    dateSk: "DATE#20260101#hs_001",
  },
});

const usecaseResult = await usecase.list({
  wardrobeId: "wd_001",
  params: {
    from: "20260101",
    to: "20260131",
    order: "asc",
    limit: 10,
    cursor: validCursor,
  },
});

let invalidCursorCode = null;
try {
  await usecase.list({
    wardrobeId: "wd_001",
    params: {
      from: "20260101",
      to: "20260131",
      order: "desc",
      cursor: validCursor,
    },
    requestId: "req_ms4_t07_cursor",
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const listHandlerResponse = await listHistoryHandler({
  path: { wardrobeId: "wd_001" },
  query: { from: "20260101", to: "20260131", order: "asc", limit: "10" },
  requestId: "req_ms4_t07_list_handler",
  dependencies: sharedDependencies,
});
const listHandlerBody = JSON.parse(listHandlerResponse.body);

const getTemplateResponse = await getHistoryHandler({
  path: { wardrobeId: "wd_001", historyId: "hs_101" },
  requestId: "req_ms4_t07_get_template",
  dependencies: sharedDependencies,
});
const getTemplateBody = JSON.parse(getTemplateResponse.body);

const getCombinationResponse = await getHistoryHandler({
  path: { wardrobeId: "wd_001", historyId: "hs_102" },
  requestId: "req_ms4_t07_get_combination",
  dependencies: sharedDependencies,
});
const getCombinationBody = JSON.parse(getCombinationResponse.body);

const checks = [
  {
    name: "history repo list supports from/to date range query and forwards order/limit/cursor",
    ok:
      repoListResult.operation === "Query"
      && repoListResult.request.input.ExpressionAttributeValues[":fromDateSk"] === "DATE#20260101#"
      && repoListResult.request.input.ExpressionAttributeValues[":toDateSk"] === "DATE#20260131#~"
      && repoListResult.request.input.ScanIndexForward === true
      && repoListResult.request.input.Limit === 5
      && repoListResult.request.input.ExclusiveStartKey?.SK === "HIST#hs_001",
    detail: repoListResult,
  },
  {
    name: "history list usecase keeps cursor consistency and supports template/combo entries",
    ok:
      listCalls.length >= 1
      && listCalls[0]?.exclusiveStartKey?.dateSk === "DATE#20260101#hs_001"
      && resolveManyCalls.length >= 1
      && usecaseResult.items.length === 2
      && usecaseResult.items[0]?.name === "通勤テンプレ"
      && usecaseResult.items[1]?.name === null
      && usecaseResult.items[1]?.clothingItems[0]?.status === "DELETED"
      && typeof usecaseResult.nextCursor === "string"
      && invalidCursorCode === "INVALID_CURSOR",
    detail: { listCalls, resolveManyCalls, usecaseResult, invalidCursorCode },
  },
  {
    name: "history list/get handlers return both template and combination patterns",
    ok:
      listHandlerResponse.statusCode === 200
      && listHandlerBody.items.length === 2
      && listHandlerBody.items[0]?.name === "通勤テンプレ"
      && listHandlerBody.items[1]?.name === null
      && getTemplateResponse.statusCode === 200
      && getTemplateBody.templateName === "通勤テンプレ"
      && getCombinationResponse.statusCode === 200
      && getCombinationBody.templateName === null
      && getCombinationBody.clothingItems[0]?.status === "DELETED",
    detail: {
      listHandlerResponse,
      listHandlerBody,
      getTemplateResponse,
      getTemplateBody,
      getCombinationResponse,
      getCombinationBody,
    },
  },
  {
    name: "source and package / CI wiring include BE-MS4-T07 aggregate spec",
    ok:
      repoSource.includes("async list(input: ListHistoryInput)")
      && usecaseSource.includes("function decodeListCursor")
      && listHandlerSource.includes("export async function listHistoryHandler")
      && getHandlerSource.includes("export async function getHistoryHandler")
      && packageJson.includes('"test:history-ms4-t07": "node --import tsx/esm scripts/check-history-ms4-t07-spec.mjs"')
      && packageJson.includes("pnpm run test:history-ms4-t07")
      && ciSource.includes("pnpm --filter api test:history-ms4-t07")
      && testDesignSource.includes("BE-MS4-T07 History 参照系 テスト設計"),
    detail: { packageJson, ciSource, testDesignSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T07 history aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T07 history aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
