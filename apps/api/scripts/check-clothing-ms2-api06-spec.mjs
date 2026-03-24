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
    requestId: "req_clothing_patch",
    method: "PATCH",
    pathname: "/wardrobes/wd_123/clothing/cl_123",
    path: { wardrobeId: "wd_123", clothingId: "cl_123" },
    query: {},
    body: { name: "更新名" },
    headers: { "content-type": "application/json" },
  });
} catch (error) {
  sharedErrorCode = error?.code ?? null;
  sharedErrorDetails = error?.details ?? null;
}

const lambda = createLambdaHandler({ domain: "clothing" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/clothing/cl_123",
  pathParameters: { wardrobeId: "wd_123", clothingId: "cl_123" },
  requestContext: { http: { method: "PATCH", path: "/wardrobes/wd_123/clothing/cl_123" }, requestId: "ctx_clothing_patch" },
  headers: { "x-request-id": "req_clothing_patch_lambda", "content-type": "application/json" },
  body: JSON.stringify({ name: "更新名" }),
});

const lambdaBody = JSON.parse(lambdaResponse.body);

const checks = [
  {
    name: "shared clothing domain handler routes PATCH requests to API-06 handler",
    ok:
      sharedErrorCode === "NOT_FOUND" &&
      sharedErrorDetails?.resource === "clothing",
    detail: { sharedErrorCode, sharedErrorDetails },
  },
  {
    name: "clothing lambda entry routes PATCH requests to API-06 handler",
    ok:
      lambdaResponse.statusCode === 404 &&
      lambdaBody.error?.code === "NOT_FOUND" &&
      lambdaBody.error?.details?.resource === "clothing",
    detail: { lambdaResponse, lambdaBody },
  },
  {
    name: "adapter source and package / CI wiring include clothing API-06 aggregate spec",
    ok:
      source.includes("updateClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api06": "node --import tsx/esm scripts/check-clothing-ms2-api06-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api06"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T07 clothing API-06 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T07 clothing API-06 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
