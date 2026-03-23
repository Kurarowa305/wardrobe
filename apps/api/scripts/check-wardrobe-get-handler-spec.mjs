import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";
process.env.S3_BUCKET ??= "wardrobe-local-bucket";
process.env.IMAGE_PUBLIC_BASE_URL ??= "http://127.0.0.1:4566/public";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/wardrobe/handlers/getWardrobeHandler.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const lambdaModulePath = path.join(root, "src/entry/lambda/wardrobe_server.ts");
const handlerModule = await import(handlerModulePath);
const adapterModule = await import(adapterModulePath);
const handlerSource = readFileSync(handlerModulePath, "utf8");
const adapterSource = readFileSync(adapterModulePath, "utf8");
const lambdaSource = readFileSync(lambdaModulePath, "utf8");
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const getCalls = [];
const response = await handlerModule.getWardrobeHandler({
  path: { wardrobeId: "wd_018f05af-f4a8-7c90-9123-abcdef123456" },
  requestId: "req_get_wardrobe",
  dependencies: {
    repo: {
      async create() {
        throw new Error("should not be called");
      },
      async get(input) {
        getCalls.push(input);
        return {
          Item: {
            wardrobeId: input.wardrobeId,
            name: "My Wardrobe",
            createdAt: 1735600000000,
          },
        };
      },
    },
  },
});

let validationError;
try {
  await handlerModule.getWardrobeHandler({
    path: { wardrobeId: "   " },
    requestId: "req_invalid_path",
    dependencies: {
      repo: { async create() { return {}; }, async get() { throw new Error("should not be called"); } },
    },
  });
} catch (error) {
  validationError = error;
}

let notFoundError;
try {
  await handlerModule.getWardrobeHandler({
    path: { wardrobeId: "wd_missing" },
    requestId: "req_missing_wardrobe",
    dependencies: {
      repo: {
        async create() {
          throw new Error("should not be called");
        },
        async get() {
          return {};
        },
      },
    },
  });
} catch (error) {
  notFoundError = error;
}

const lambdaHandler = adapterModule.createLambdaHandler({
  domain: "wardrobe",
  handler(request) {
    assert.equal(request.method, "GET");
    assert.equal(request.path.wardrobeId, "wd_018f05af-f4a8-7c90-9123-abcdef123456");

    return handlerModule.getWardrobeHandler({
      path: request.path,
      requestId: request.requestId,
      dependencies: {
        repo: {
          async create() {
            throw new Error("should not be called");
          },
          async get(input) {
            return {
              Item: {
                wardrobeId: input.wardrobeId,
                name: "Lambda Wardrobe",
                createdAt: 1735600000000,
              },
            };
          },
        },
      },
    });
  },
});

const lambdaResponse = await lambdaHandler({
  rawPath: "/wardrobes/wd_018f05af-f4a8-7c90-9123-abcdef123456",
  pathParameters: { wardrobeId: "wd_018f05af-f4a8-7c90-9123-abcdef123456" },
  requestContext: {
    http: {
      method: "GET",
      path: "/wardrobes/wd_018f05af-f4a8-7c90-9123-abcdef123456",
    },
    requestId: "ctx_get_wardrobe",
  },
  headers: { "x-request-id": "req_lambda_get_wardrobe" },
});
const lambdaJson = JSON.parse(lambdaResponse.body);

const checks = [
  {
    name: "getWardrobeHandler returns 200 and wardrobe name from usecase",
    ok:
      response.statusCode === 200 &&
      response.json.name === "My Wardrobe" &&
      getCalls.length === 1 &&
      getCalls[0].wardrobeId === "wd_018f05af-f4a8-7c90-9123-abcdef123456",
    detail: { response: response.json, getCalls },
  },
  {
    name: "getWardrobeHandler rejects blank wardrobeId with VALIDATION_ERROR",
    ok:
      validationError?.code === "VALIDATION_ERROR" &&
      validationError?.status === 400 &&
      validationError?.requestId === "req_invalid_path" &&
      typeof validationError?.details?.["path.wardrobeId"] === "string",
    detail: validationError,
  },
  {
    name: "getWardrobeHandler propagates NOT_FOUND when wardrobe does not exist",
    ok:
      notFoundError?.code === "NOT_FOUND" &&
      notFoundError?.status === 404 &&
      notFoundError?.details?.resource === "wardrobe" &&
      notFoundError?.details?.wardrobeId === "wd_missing",
    detail: notFoundError,
  },
  {
    name: "wardrobe lambda-style handler routes GET /wardrobes/{wardrobeId} to getWardrobeHandler",
    ok:
      lambdaResponse.statusCode === 200 &&
      lambdaJson.name === "Lambda Wardrobe",
    detail: { lambdaResponse, lambdaJson },
  },
  {
    name: "adapter and handler source wire wardrobe GET handling",
    ok:
      handlerSource.includes("export async function getWardrobeHandler") &&
      handlerSource.includes("createWardrobeUsecase") &&
      adapterSource.includes('request.method === "GET" && request.path.wardrobeId') &&
      adapterSource.includes("getWardrobeHandler") &&
      lambdaSource.includes('export const handler = createLambdaHandler({ domain: "wardrobe" });'),
  },
  {
    name: "package script and CI include wardrobe get handler spec test",
    ok:
      packageJson.includes('"test:wardrobe-get-handler": "node --import tsx/esm scripts/check-wardrobe-get-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:wardrobe-get-handler"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS1-T04 wardrobe get handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS1-T04 wardrobe get handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
