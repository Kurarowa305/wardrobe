import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { sharedDomainHandlers, createLambdaHandler } = await import(adapterModulePath);

let sharedErrorCode = null;
let sharedErrorDetails = null;

try {
  await sharedDomainHandlers.clothing({
    requestId: "req_clothing_get",
    method: "GET",
    pathname: "/wardrobes/wd_123/clothing/cl_123",
    path: { wardrobeId: "wd_123", clothingId: "cl_123" },
    query: {},
    body: {},
    headers: {},
  });
} catch (error) {
  sharedErrorCode = error?.code ?? null;
  sharedErrorDetails = error?.details ?? null;
}

const lambda = createLambdaHandler({ domain: "clothing" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/clothing/cl_123",
  pathParameters: { wardrobeId: "wd_123", clothingId: "cl_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/clothing/cl_123" }, requestId: "ctx_clothing_get" },
  headers: { "x-request-id": "req_clothing_get_lambda" },
});

const lambdaBody = JSON.parse(lambdaResponse.body);

const checks = [
  {
    name: "shared clothing domain handler routes detail GET requests to API-05 handler (NOT_FOUND shape)",
    ok:
      sharedErrorCode === "NOT_FOUND" &&
      sharedErrorDetails?.resource === "clothing",
    detail: { sharedErrorCode, sharedErrorDetails },
  },
  {
    name: "clothing lambda entry routes detail GET requests to API-05 handler (NOT_FOUND shape)",
    ok:
      lambdaResponse.statusCode === 404 &&
      lambdaBody.error?.code === "NOT_FOUND" &&
      lambdaBody.error?.details?.resource === "clothing",
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include clothing API-05 aggregate spec",
    ok:
      source.includes("getClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api05": "node --import tsx/esm scripts/check-clothing-ms2-api05-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api05"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T06 clothing API-05 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T06 clothing API-05 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
