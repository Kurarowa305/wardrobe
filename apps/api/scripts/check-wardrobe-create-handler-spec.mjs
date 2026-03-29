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

const handlerModulePath = path.join(root, "src/domains/wardrobe/handlers/createWardrobeHandler.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const lambdaModulePath = path.join(root, "src/entry/lambda/wardrobe_server.ts");
const handlerModule = await import(handlerModulePath);
const adapterModule = await import(adapterModulePath);
const lambdaModule = await import(lambdaModulePath);
const handlerSource = readFileSync(handlerModulePath, "utf8");
const adapterSource = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const createCalls = [];
const response = await handlerModule.createWardrobeHandler({
  headers: { "content-type": "application/json; charset=utf-8" },
  body: { name: "  My Wardrobe  " },
  requestId: "req_create_wardrobe",
  dependencies: {
    repo: {
      async create(input) {
        createCalls.push(input);
        return { ok: true };
      },
      async get() {
        return {};
      },
    },
    now: () => 1735600000000,
    generateWardrobeId: () => "wd_018f05af-f4a8-7c90-9123-abcdef123456",
  },
});

let validationError;
try {
  await handlerModule.createWardrobeHandler({
    headers: { "content-type": "application/json" },
    body: { name: "   " },
    requestId: "req_invalid_name",
    dependencies: {
      repo: { async create() { throw new Error("should not be called"); }, async get() { return {}; } },
    },
  });
} catch (error) {
  validationError = error;
}

let mediaTypeError;
try {
  await handlerModule.createWardrobeHandler({
    headers: { "content-type": "text/plain" },
    body: { name: "My Wardrobe" },
    requestId: "req_invalid_media",
  });
} catch (error) {
  mediaTypeError = error;
}

const lambdaHandler = adapterModule.createLambdaHandler({
  domain: "wardrobe",
  handler(request) {
    return handlerModule.createWardrobeHandler({
      headers: request.headers,
      body: request.body,
      requestId: request.requestId,
      dependencies: {
        repo: {
          async create() {
            return { ok: true };
          },
          async get() {
            return {};
          },
        },
        now: () => 1735600000000,
        generateWardrobeId: () => "wd_018f05af-f4a8-7c90-9123-abcdef123456",
      },
    });
  },
});

const lambdaResponse = await lambdaHandler({
  rawPath: "/wardrobes",
  requestContext: { http: { method: "POST", path: "/wardrobes" }, requestId: "ctx_create_wardrobe" },
  headers: { "content-type": "application/json", "x-request-id": "req_lambda_create_wardrobe" },
  body: JSON.stringify({ name: "API Wardrobe" }),
});
const lambdaJson = JSON.parse(lambdaResponse.body);

const checks = [
  {
    name: "createWardrobeHandler returns 201 and wardrobeId from usecase",
    ok:
      response.statusCode === 201 &&
      response.json.wardrobeId === "wd_018f05af-f4a8-7c90-9123-abcdef123456" &&
      createCalls.length === 1 &&
      createCalls[0].name === "My Wardrobe" &&
      createCalls[0].createdAt === 1735600000000,
    detail: { response: response.json, createCalls },
  },
  {
    name: "createWardrobeHandler rejects blank name with VALIDATION_ERROR",
    ok:
      validationError?.code === "VALIDATION_ERROR" &&
      validationError?.status === 400 &&
      validationError?.requestId === "req_invalid_name" &&
      typeof validationError?.details?.["body.name"] === "string",
    detail: validationError,
  },
  {
    name: "createWardrobeHandler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE",
    ok:
      mediaTypeError?.code === "UNSUPPORTED_MEDIA_TYPE" &&
      mediaTypeError?.status === 415,
    detail: mediaTypeError,
  },
  {
    name: "wardrobe lambda entry routes POST /wardrobes to createWardrobeHandler",
    ok:
      lambdaResponse.statusCode === 201 &&
      /^wd_[0-9a-f-]+$/.test(lambdaJson.wardrobeId),
    detail: { lambdaResponse, lambdaJson },
  },
  {
    name: "adapter and handler source wire wardrobe POST handling",
    ok:
      handlerSource.includes("export async function createWardrobeHandler") &&
      handlerSource.includes("assertJsonContentType") &&
      adapterSource.includes('request.method === "POST" && request.pathname === "/wardrobes"') &&
      adapterSource.includes("createWardrobeHandler"),
  },
  {
    name: "package script and CI include wardrobe create handler spec test",
    ok:
      packageJson.includes('"test:wardrobe-create-handler": "node --import tsx/esm scripts/check-wardrobe-create-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:wardrobe-create-handler"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS1-T03 wardrobe create handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS1-T03 wardrobe create handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
