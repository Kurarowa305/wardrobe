import { encodeCursor } from "../src/core/cursor/index.ts";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const handlerModulePath = path.join(root, "src/domains/template/handlers/listTemplateHandler.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const handlerSource = readFileSync(handlerModulePath, "utf8");
const adapterSource = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const usecase = await import(usecaseModulePath);
const handler = await import(handlerModulePath);
const { sharedDomainHandlers, createLambdaHandler } = await import(adapterModulePath);

const templateRepoCalls = [];
const clothingBatchCalls = [];
const templateRepo = {
  async list(input) {
    templateRepoCalls.push(input);
    return {
      Items: [
        {
          templateId: "tp_001",
          name: "通勤",
          clothingIds: ["cl_03", "cl_01", "cl_02", "cl_04", "cl_05"],
        },
      ],
      LastEvaluatedKey: {
        PK: "W#wd_001#TPL",
        SK: "TPL#tp_001",
        statusListPk: "W#wd_001#TPL#ACTIVE",
        createdAtSk: "CREATED#1735690000123#tp_001",
      },
    };
  },
};
const clothingBatchRepo = {
  async batchGetByIds(input) {
    clothingBatchCalls.push(input);
    return [
      {
        Responses: {
          WardrobeTable: [
            { clothingId: "cl_01", imageKey: "image/01.png", status: "ACTIVE" },
            { clothingId: "cl_02", imageKey: null, status: "DELETED" },
            { clothingId: "cl_03", imageKey: "image/03.png", status: "ACTIVE" },
            { clothingId: "cl_04", imageKey: "image/04.png", status: "ACTIVE" },
            { clothingId: "cl_05", imageKey: "image/05.png", status: "ACTIVE" },
          ],
        },
      },
    ];
  },
};

const listUsecase = usecase.createTemplateUsecase({ repo: templateRepo, clothingBatchRepo });
const listResult = await listUsecase.list({
  wardrobeId: "wd_001",
  params: { order: "asc", limit: 3 },
  requestId: "req_template_list",
});

const decodedCursor = JSON.parse(Buffer.from(listResult.nextCursor, "base64url").toString("utf8"));

const cursorRepoCalls = [];
const cursorRepo = {
  async list(input) {
    cursorRepoCalls.push(input);
    return { Items: [], LastEvaluatedKey: undefined };
  },
};

const cursorUsecase = usecase.createTemplateUsecase({
  repo: cursorRepo,
  clothingBatchRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});

await cursorUsecase.list({
  wardrobeId: "wd_001",
  params: {
    order: "desc",
    cursor: encodeCursor({
      resource: "template-list",
      order: "desc",
      filters: {},
      position: {
        PK: "W#wd_001#TPL",
        SK: "TPL#tp_010",
        statusListPk: "W#wd_001#TPL#ACTIVE",
        createdAtSk: "CREATED#1735700000000#tp_010",
      },
    }),
  },
  requestId: "req_template_cursor",
});

let invalidCursorCode = null;
try {
  await cursorUsecase.list({
    wardrobeId: "wd_001",
    params: {
      order: "asc",
      cursor: encodeCursor({
        resource: "template-list",
        order: "desc",
        filters: {},
        position: {
          PK: "W#wd_001#TPL",
          SK: "TPL#tp_010",
          statusListPk: "W#wd_001#TPL#ACTIVE",
        },
      }),
    },
    requestId: "req_template_invalid_cursor",
  });
} catch (error) {
  invalidCursorCode = error?.code ?? null;
}

const handlerResponse = await handler.listTemplateHandler({
  path: { wardrobeId: "wd_001" },
  query: { order: "desc", limit: "2" },
  requestId: "req_template_handler",
  dependencies: {
    repo: {
      async list() {
        return { Items: [], LastEvaluatedKey: undefined };
      },
    },
    clothingBatchRepo: {
      async batchGetByIds() {
        return [];
      },
    },
  },
});

const sharedHandlerResponse = await sharedDomainHandlers.template({
  requestId: "req_template_domain",
  method: "GET",
  pathname: "/wardrobes/wd_001/templates",
  path: { wardrobeId: "wd_001" },
  query: { order: "asc", limit: "2" },
  body: {},
  headers: {},
});

const lambda = createLambdaHandler({ domain: "template" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_001/templates",
  rawQueryString: "order=desc&limit=2",
  pathParameters: { wardrobeId: "wd_001" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/templates" }, requestId: "ctx_template_list" },
  headers: { "x-request-id": "req_template_lambda" },
});

const checks = [
  {
    name: "usecase lists ACTIVE templates by createdAt and resolves clothingItems in original order with max 4 thumbnails",
    ok:
      templateRepoCalls.length === 1 &&
      templateRepoCalls[0].indexName === "StatusListByCreatedAt" &&
      templateRepoCalls[0].scanIndexForward === true &&
      templateRepoCalls[0].limit === 3 &&
      clothingBatchCalls.length === 1 &&
      listResult.items.length === 1 &&
      listResult.items[0].clothingItems.length === 4 &&
      listResult.items[0].clothingItems[0].clothingId === "cl_03" &&
      listResult.items[0].clothingItems[1].status === "ACTIVE" &&
      listResult.items[0].clothingItems[2].status === "DELETED",
    detail: { templateRepoCalls, clothingBatchCalls, listResult },
  },
  {
    name: "usecase encodes/decodes cursor envelope and rejects cursor order mismatch as INVALID_CURSOR",
    ok:
      decodedCursor.resource === "template-list" &&
      decodedCursor.order === "asc" &&
      decodedCursor.position.createdAtSk === "CREATED#1735690000123#tp_001" &&
      cursorRepoCalls.length === 1 &&
      cursorRepoCalls[0].scanIndexForward === false &&
      cursorRepoCalls[0].exclusiveStartKey.createdAtSk === "CREATED#1735700000000#tp_010" &&
      invalidCursorCode === "INVALID_CURSOR",
    detail: { decodedCursor, cursorRepoCalls, invalidCursorCode },
  },
  {
    name: "handler validates query params and returns template list response envelope",
    ok:
      handlerResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(handlerResponse.body).items) &&
      JSON.parse(handlerResponse.body).nextCursor === null,
    detail: handlerResponse,
  },
  {
    name: "template domain routes API-08 on shared handler and lambda adapter",
    ok:
      sharedHandlerResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(sharedHandlerResponse.body).items) &&
      lambdaResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(lambdaResponse.body).items),
    detail: { sharedHandlerResponse, lambdaResponse },
  },
  {
    name: "source/package/CI wiring include API-08 usecase-handler spec",
    ok:
      usecaseSource.includes("export function createTemplateUsecase") &&
      usecaseSource.includes("templateListThumbnailMaxCount = 4") &&
      handlerSource.includes("export async function listTemplateHandler") &&
      adapterSource.includes("listTemplateHandler") &&
      packageJson.includes('"test:template-ms3-api08": "node --import tsx/esm scripts/check-template-ms3-api08-spec.mjs"') &&
      packageJson.includes("pnpm run test:template-ms3-api08") &&
      ciSource.includes("pnpm --filter api test:template-ms3-api08"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T05 template API-08 usecase/handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T05 template API-08 usecase/handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
