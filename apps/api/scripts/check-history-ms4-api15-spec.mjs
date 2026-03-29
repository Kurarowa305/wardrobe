import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const handlerModulePath = path.join(root, "src/domains/history/handlers/getHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createLambdaHandler } = await import(adapterModulePath);
const { getHistoryHandler } = await import(handlerModulePath);

const historyGetDependencies = {
  repo: {
    async list() {
      return {};
    },
    async get() {
      return {};
    },
  },
  historyDetailsResolver: {
    async resolveMany() {
      return [];
    },
    async resolveOne() {
      return {
        historyId: "hs_stub",
        date: "20260101",
        templateName: null,
        clothingItems: [],
      };
    },
  },
};

let getErrorCode = null;
try {
  await getHistoryHandler({
    path: { wardrobeId: "wd_123", historyId: "hs_123" },
    requestId: "req_history_detail",
    dependencies: historyGetDependencies,
  });
} catch (error) {
  getErrorCode = error?.code ?? null;
}

const lambda = createLambdaHandler({
  domain: "history",
  handler(request) {
    return getHistoryHandler({
      path: request.path,
      requestId: request.requestId,
      dependencies: historyGetDependencies,
    });
  },
});
const lambdaResponse = await lambda({
  rawPath: "/wardrobes/wd_123/histories/hs_123",
  pathParameters: { wardrobeId: "wd_123", historyId: "hs_123" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_123/histories/hs_123" }, requestId: "ctx_history_detail" },
  headers: { "x-request-id": "req_history_lambda_detail" },
});

const checks = [
  {
    name: "shared history domain handler routes GET detail requests to get handler",
    ok: getErrorCode === "NOT_FOUND",
    detail: getErrorCode,
  },
  {
    name: "history lambda entry accepts API-15 GET detail route and returns get-route response",
    ok:
      lambdaResponse.statusCode === 404 &&
      JSON.parse(lambdaResponse.body).error?.code === "NOT_FOUND",
    detail: lambdaResponse,
  },
  {
    name: "adapter source and package / CI wiring include history API-15 aggregate spec",
    ok:
      source.includes("getHistoryHandler") &&
      packageJson.includes('"test:history-ms4-api15": "node --import tsx/esm scripts/check-history-ms4-api15-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:history-ms4-api15"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T06 history API-15 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T06 history API-15 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
