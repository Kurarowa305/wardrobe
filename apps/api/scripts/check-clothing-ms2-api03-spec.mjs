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

const listResponse = await sharedDomainHandlers.clothing({
  requestId: "req_clothing_list",
  method: "GET",
  pathname: "/wardrobes/wd_123/clothing",
  path: { wardrobeId: "wd_123" },
  query: { order: "asc", genre: "tops", limit: "3" },
  body: {},
  headers: {},
});

const lambda = createLambdaHandler({ domain: "clothing" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/clothing",
  rawQueryString: "order=asc&limit=3",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/clothing" }, requestId: "ctx_clothing_list" },
  headers: { "x-request-id": "req_clothing_lambda" },
});

const checks = [
  {
    name: "shared clothing domain handler routes GET collection requests to list handler shape",
    ok:
      listResponse.statusCode === 200 &&
      JSON.parse(listResponse.body).items &&
      JSON.parse(listResponse.body).nextCursor === null,
    detail: listResponse,
  },
  {
    name: "clothing lambda entry returns API-03 response envelope for collection GET requests",
    ok:
      lambdaResponse.statusCode === 200 &&
      Array.isArray(JSON.parse(lambdaResponse.body).items) &&
      JSON.parse(lambdaResponse.body).nextCursor === null,
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include clothing API-03 aggregate spec",
    ok:
      source.includes("listClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api03": "node --import tsx/esm scripts/check-clothing-ms2-api03-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api03"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T04 clothing API-03 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T04 clothing API-03 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
