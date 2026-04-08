import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeCursor } from "../src/core/cursor/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/template/handlers/listTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { listTemplateHandler } = await import(handlerModulePath);
const encodedCursor = encodeCursor({
  resource: "template-list",
  order: "asc",
  filters: {},
  position: {
    PK: "W#wd_001#TPL",
    SK: "TPL#tp_003",
    statusListPk: "W#wd_001#TPL#ACTIVE",
    createdAtSk: "CREATED#1735690000999#tp_003",
  },
});

const usecaseCalls = [];
const response = await listTemplateHandler({
  path: { wardrobeId: "wd_001" },
  query: { order: "desc", limit: "2" },
  requestId: "req_template_handler",
  dependencies: {
    repo: {
      async list(input) {
        usecaseCalls.push(input);
        return {
          Items: [{ templateId: "tp_001", name: "週末", clothingIds: ["cl_001"] }],
          LastEvaluatedKey: null,
        };
      },
    },
    clothingBatchGetRepo: {
      async batchGetByIds() {
        return [
          {
            Responses: {
              WardrobeTable: [
                { clothingId: "cl_001", imageKey: null, status: "ACTIVE" },
              ],
            },
          },
        ];
      },
    },
  },
});

const arrayQueryCalls = [];
const arrayQueryResponse = await listTemplateHandler({
  path: { wardrobeId: "wd_001" },
  query: { order: ["asc", "desc"], limit: ["3", "9"], cursor: [encodedCursor, "cursor_002"] },
  requestId: "req_template_handler_array_query",
  dependencies: {
    repo: {
      async list(input) {
        arrayQueryCalls.push(input);
        return {
          Items: [],
          LastEvaluatedKey: null,
        };
      },
    },
    clothingBatchGetRepo: {
      async batchGetByIds() {
        return [];
      },
    },
  },
});

let validationCode = null;
try {
  await listTemplateHandler({
    path: { wardrobeId: "   " },
    query: { limit: "0" },
    requestId: "req_template_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

const responseJson = JSON.parse(response.body);
const arrayQueryResponseJson = JSON.parse(arrayQueryResponse.body);

const checks = [
  {
    name: "list handler validates path/query and returns template list success response",
    ok:
      response.statusCode === 200 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.items.length === 1 &&
      responseJson.items[0].templateId === "tp_001" &&
      responseJson.items[0].clothingItems.length === 1 &&
      responseJson.nextCursor === null,
    detail: { response, responseJson },
  },
  {
    name: "list handler coerces numeric limit and forwards query parameters to usecase dependencies",
    ok:
      usecaseCalls.length === 1 &&
      usecaseCalls[0].limit === 2 &&
      usecaseCalls[0].scanIndexForward === false,
    detail: usecaseCalls,
  },
  {
    name: "list handler accepts array query values from multi-value query strings and uses first value",
    ok:
      arrayQueryResponse.statusCode === 200 &&
      arrayQueryResponseJson.items.length === 0 &&
      arrayQueryCalls.length === 1 &&
      arrayQueryCalls[0].limit === 3 &&
      arrayQueryCalls[0].scanIndexForward === true &&
      typeof arrayQueryCalls[0].exclusiveStartKey?.PK === "string",
    detail: { arrayQueryResponse, arrayQueryResponseJson, arrayQueryCalls },
  },
  {
    name: "list handler rejects invalid wardrobeId/limit with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "source exports listTemplateHandler plus package script / CI wiring",
    ok:
      source.includes("export async function listTemplateHandler") &&
      packageJson.includes('"test:template-list-handler": "node --import tsx/esm scripts/check-template-list-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-list-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T05 template list handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T05 template list handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
