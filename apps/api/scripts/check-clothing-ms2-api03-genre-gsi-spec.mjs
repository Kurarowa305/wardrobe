import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const handlerModulePath = path.join(root, "src/domains/clothing/handlers/listClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createLambdaHandler } = await import(adapterModulePath);
const { listClothingHandler } = await import(handlerModulePath);

const listCalls = [];
const dependencies = {
  repo: {
    async list(input) {
      listCalls.push(input);
      return {
        Items: [
          { clothingId: "cl_001", name: "黒T", genre: "tops", imageKey: null },
          { clothingId: "cl_999", name: "テスト混在", genre: "others", imageKey: null },
        ],
        LastEvaluatedKey: {
          PK: "W#wd_123#CLOTH",
          SK: "CLOTH#cl_999",
          statusGenreListPk: "W#wd_123#CLOTH#ACTIVE#GENRE#tops",
          createdAtSk: "CREATED#1735690000123#cl_999",
        },
      };
    },
    async create() {
      return { ok: true };
    },
    async get() {
      return {};
    },
    async update() {
      return { ok: true };
    },
    async delete() {
      return { ok: true };
    },
  },
};

const handlerResponse = await listClothingHandler({
  path: { wardrobeId: "wd_123" },
  query: { order: "asc", genre: "tops", limit: "3" },
  requestId: "req_clothing_list_genre",
  dependencies,
});

const lambda = createLambdaHandler({
  domain: "clothing",
  handler(request) {
    return listClothingHandler({
      path: request.path,
      query: request.query,
      requestId: request.requestId,
      dependencies,
    });
  },
});
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/clothing",
  rawQueryString: "order=asc&genre=tops&limit=3",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/clothing" }, requestId: "ctx_clothing_list_genre" },
  headers: { "x-request-id": "req_clothing_lambda_genre" },
});

const handlerJson = JSON.parse(handlerResponse.body);
const lambdaJson = JSON.parse(lambdaResponse.body);

const checks = [
  {
    name: "API-03 handler with genre uses status+genre createdAt index",
    ok:
      listCalls.length >= 1 &&
      listCalls[0].indexName === "StatusGenreListByCreatedAt" &&
      listCalls[0].genre === "tops" &&
      listCalls[0].scanIndexForward === true,
    detail: listCalls,
  },
  {
    name: "API-03 handler keeps repository items as-is and returns nextCursor",
    ok:
      handlerResponse.statusCode === 200 &&
      handlerJson.items.length === 2 &&
      handlerJson.items[0].clothingId === "cl_001" &&
      typeof handlerJson.nextCursor === "string",
    detail: { handlerResponse, handlerJson },
  },
  {
    name: "clothing lambda entry returns API-03 genre response envelope",
    ok:
      lambdaResponse.statusCode === 200 &&
      Array.isArray(lambdaJson.items) &&
      lambdaJson.items.length === 2 &&
      typeof lambdaJson.nextCursor === "string",
    detail: { lambdaResponse, lambdaJson },
  },
  {
    name: "adapter source and package / CI wiring include API-03 genre GSI aggregate spec",
    ok:
      source.includes("listClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api03-genre-gsi": "node --import tsx/esm scripts/check-clothing-ms2-api03-genre-gsi-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api03-genre-gsi"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T11 clothing API-03 genre GSI aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T11 clothing API-03 genre GSI aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
