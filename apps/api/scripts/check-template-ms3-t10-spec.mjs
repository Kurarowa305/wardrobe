import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const handlerModulePath = path.join(root, "src/domains/template/handlers/createTemplateHandler.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const testDesignPath = path.join(root, "../../design/テスト設計/BE-MS3-T10_Templateテスト設計.md");

const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const handlerSource = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const testDesignSource = readFileSync(testDesignPath, "utf8");

const { createTemplateUsecase } = await import(usecaseModulePath);
const { createTemplateHandler } = await import(handlerModulePath);
const { createLambdaHandler } = await import(adapterModulePath);

const listBatchCalls = [];
const listUsecase = createTemplateUsecase({
  repo: {
    async list() {
      return {
        Items: [
          {
            wardrobeId: "wd_001",
            templateId: "tp_001",
            name: "出勤",
            status: "ACTIVE",
            clothingIds: ["cl_003", "cl_001", "cl_002"],
            wearCount: 4,
            lastWornAt: 1735689600000,
            createdAt: 1735603200000,
            deletedAt: null,
            PK: "W#wd_001#TPL",
            SK: "TPL#tp_001",
            statusListPk: "W#wd_001#TPL#ACTIVE",
            createdAtSk: "CREATED#1735603200000#tp_001",
            wearCountSk: "WEAR#0000000004#tp_001",
            lastWornAtSk: "LASTWORN#1735689600000#tp_001",
          },
        ],
      };
    },
    async create() {
      return {};
    },
    async get() {
      return { Item: undefined };
    },
    async update() {
      return {};
    },
    async delete() {
      return {};
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds(input) {
      listBatchCalls.push(input);
      return [
        {
          Responses: {
            WardrobeTable: [
              { clothingId: "cl_001", imageKey: "img/1.jpg", status: "ACTIVE" },
              { clothingId: "cl_002", imageKey: null, status: "ACTIVE" },
              { clothingId: "cl_003", imageKey: "img/3.jpg", status: "DELETED" },
            ],
          },
        },
      ];
    },
  },
});

const listResult = await listUsecase.list({
  wardrobeId: "wd_001",
  params: {},
});

const getUsecase = createTemplateUsecase({
  repo: {
    async list() {
      return { Items: [] };
    },
    async create() {
      return {};
    },
    async get() {
      return {
        Item: {
          wardrobeId: "wd_001",
          templateId: "tp_001",
          name: "詳細テンプレ",
          status: "ACTIVE",
          clothingIds: ["cl_010", "cl_020"],
          wearCount: 2,
          lastWornAt: 1735689600000,
          createdAt: 1735603200000,
          deletedAt: null,
          PK: "W#wd_001#TPL",
          SK: "TPL#tp_001",
          statusListPk: "W#wd_001#TPL#ACTIVE",
          createdAtSk: "CREATED#1735603200000#tp_001",
          wearCountSk: "WEAR#0000000002#tp_001",
          lastWornAtSk: "LASTWORN#1735689600000#tp_001",
        },
      };
    },
    async update() {
      return {};
    },
    async delete() {
      return {};
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [
              {
                clothingId: "cl_020",
                name: "削除済みパンツ",
                genre: "bottoms",
                imageKey: null,
                status: "DELETED",
                wearCount: 5,
                lastWornAt: 1735500000000,
              },
              {
                clothingId: "cl_010",
                name: "トップス",
                genre: "tops",
                imageKey: "img/10.jpg",
                status: "ACTIVE",
                wearCount: 7,
                lastWornAt: 1735689600000,
              },
            ],
          },
        },
      ];
    },
  },
});

const getResult = await getUsecase.get({
  wardrobeId: "wd_001",
  templateId: "tp_001",
});

let duplicateCode = null;
try {
  await createTemplateHandler({
    path: { wardrobeId: "wd_001" },
    body: { name: "重複テンプレ", clothingIds: ["cl_001", "cl_001"] },
    headers: { "content-type": "application/json" },
    requestId: "req_duplicate",
    dependencies: {
      repo: {
        async list() {
          return { Items: [] };
        },
        async create() {
          return {};
        },
      },
      clothingBatchGetRepo: {
        async batchGetByIds() {
          return [];
        },
      },
      generateTemplateId: () => "tp_dup",
      now: () => 1735689600000,
    },
  });
} catch (error) {
  duplicateCode = error?.code ?? null;
}

const lambda = createLambdaHandler({
  domain: "template",
  handler: (request) => {
    return createTemplateHandler({
      path: request.path,
      body: request.body,
      headers: request.headers,
      requestId: request.requestId,
      dependencies: {
        repo: {
          async list() {
            return { Items: [] };
          },
          async create() {
            return {};
          },
        },
        clothingBatchGetRepo: {
          async batchGetByIds() {
            return [];
          },
        },
        generateTemplateId: () => "tp_dup",
        now: () => 1735689600000,
      },
    });
  },
});

const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_001/templates",
  pathParameters: { wardrobeId: "wd_001" },
  requestContext: { http: { method: "POST", path: "/wardrobes/wd_001/templates" }, requestId: "ctx_duplicate" },
  headers: { "x-request-id": "req_duplicate_lambda", "content-type": "application/json" },
  body: JSON.stringify({ name: "重複テンプレ", clothingIds: ["cl_001", "cl_001"] }),
});
const lambdaError = JSON.parse(lambdaResponse.body).error;

const checks = [
  {
    name: "template list usecase performs BatchGet completion and keeps clothingIds order",
    ok:
      listBatchCalls.length === 1
      && listBatchCalls[0].wardrobeId === "wd_001"
      && listBatchCalls[0].clothingIds.length === 3
      && listResult.items.length === 1
      && listResult.items[0].clothingItems.length === 3
      && listResult.items[0].clothingItems[0].clothingId === "cl_003"
      && listResult.items[0].clothingItems[1].clothingId === "cl_001"
      && listResult.items[0].clothingItems[2].clothingId === "cl_002",
    detail: { listBatchCalls, listResult },
  },
  {
    name: "template get usecase response can include deleted clothing items",
    ok:
      getResult.clothingItems.length === 2
      && getResult.clothingItems[1].clothingId === "cl_020"
      && getResult.clothingItems[1].status === "DELETED",
    detail: getResult,
  },
  {
    name: "template create handler returns conflict for duplicate clothingIds and lambda maps it to 409",
    ok:
      duplicateCode === "CONFLICT"
      && lambdaResponse.statusCode === 409
      && lambdaError?.code === "CONFLICT",
    detail: { duplicateCode, lambdaResponse, lambdaError },
  },
  {
    name: "source and package / CI wiring include template MS3-T10 aggregate spec",
    ok:
      usecaseSource.includes("async list(input: ListTemplateUsecaseInput)")
      && usecaseSource.includes("async get(input: GetTemplateUsecaseInput)")
      && handlerSource.includes("export async function createTemplateHandler")
      && packageJson.includes('"test:template-ms3-t10": "node --import tsx/esm scripts/check-template-ms3-t10-spec.mjs"')
      && packageJson.includes("pnpm run test:template-ms3-t10")
      && ciSource.includes("pnpm --filter api test:template-ms3-t10")
      && testDesignSource.includes("BE-MS3-T10 Template テスト設計"),
    detail: { packageJson, ciSource, testDesignSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T10 template aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T10 template aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
