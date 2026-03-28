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

const response = await sharedDomainHandlers.history({
  requestId: "req_history_get",
  method: "GET",
  pathname: "/wardrobes/wd_123/histories",
  path: { wardrobeId: "wd_123" },
  query: { order: "desc", limit: "1" },
  body: {},
  headers: {},
});
const parsedResponse = JSON.parse(response.body);

const lambda = createLambdaHandler({ domain: "history" });
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/histories",
  rawQueryString: "order=desc&limit=1",
  pathParameters: { wardrobeId: "wd_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/histories" }, requestId: "ctx_history_get" },
  headers: { "x-request-id": "req_history_lambda" },
});

const checks = [
  {
    name: "shared history domain handler routes GET collection requests to list handler",
    ok: response.statusCode === 200 && Array.isArray(parsedResponse.items) && parsedResponse.nextCursor === null,
    detail: response,
  },
  {
    name: "history lambda entry accepts API-13 GET route and returns list response",
    ok:
      lambdaResponse.statusCode === 200
      && Array.isArray(JSON.parse(lambdaResponse.body).items),
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include history API-13 aggregate spec",
    ok:
      source.includes("listHistoryHandler")
      && packageJson.includes('"test:history-ms4-api13": "node --import tsx/esm scripts/check-history-ms4-api13-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-ms4-api13"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T05 history API-13 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T05 history API-13 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
