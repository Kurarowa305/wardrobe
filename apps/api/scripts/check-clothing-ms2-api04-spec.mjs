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

const createResponse = await sharedDomainHandlers.clothing({
  requestId: "req_clothing_create",
  method: "POST",
  pathname: "/wardrobes/wd_123/clothing",
  path: { wardrobeId: "wd_123" },
  query: {},
  body: { name: "ネイビージャケット", genre: "tops", imageKey: "images/navy-jacket.png" },
  headers: { "content-type": "application/json" },
});

const lambda = createLambdaHandler({ domain: "clothing" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/clothing",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "POST", path: "/wardrobes/wd_123/clothing" }, requestId: "ctx_clothing_create" },
  headers: { "content-type": "application/json", "x-request-id": "req_clothing_lambda" },
  body: JSON.stringify({ name: "ワイドパンツ", genre: "bottoms" }),
});

const checks = [
  {
    name: "shared clothing domain handler routes POST collection requests to create handler shape",
    ok:
      createResponse.statusCode === 201 &&
      typeof JSON.parse(createResponse.body).clothingId === "string" &&
      JSON.parse(createResponse.body).clothingId.startsWith("cl_"),
    detail: createResponse,
  },
  {
    name: "clothing lambda entry returns API-04 response envelope for collection POST requests",
    ok:
      lambdaResponse.statusCode === 201 &&
      typeof JSON.parse(lambdaResponse.body).clothingId === "string" &&
      JSON.parse(lambdaResponse.body).clothingId.startsWith("cl_"),
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include clothing API-04 aggregate spec",
    ok:
      source.includes("createClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api04": "node --import tsx/esm scripts/check-clothing-ms2-api04-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api04"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T05 clothing API-04 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T05 clothing API-04 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
