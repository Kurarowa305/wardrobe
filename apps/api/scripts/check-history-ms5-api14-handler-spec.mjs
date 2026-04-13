import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/history/handlers/createHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryHandler } = await import(handlerModulePath);

const createCalls = [];
const response = await createHistoryHandler({
  path: { wardrobeId: "wd_001" },
  body: { date: "20260101", templateId: "tp_001" },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_history_create",
  dependencies: {
    templateRepo: {
      async get() {
        return {
          Item: {
            clothingIds: ["cl_001", "cl_002"],
          },
        };
      },
    },
    async transactWriteItems(items) {
      createCalls.push(items);
      return { ok: true };
    },
    now: () => 1_735_689_600_000,
    generateHistoryId: () => "hs_00000000-0000-7000-8000-000000000000",
  },
});

const responseJson = JSON.parse(response.body);

let unsupportedMediaTypeCode = null;
try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260101", templateId: "tp_001" },
    headers: { "content-type": "text/plain" },
    requestId: "req_history_invalid_content_type",
  });
} catch (error) {
  unsupportedMediaTypeCode = error?.code ?? null;
}

let validationCode = null;
try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "2026-01-01", clothingIds: ["cl_001"] },
    headers: { "content-type": "application/json" },
    requestId: "req_history_invalid_body",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let conflictCode = null;
try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260101", clothingIds: ["cl_001", "cl_001"] },
    headers: { "content-type": "application/json" },
    requestId: "req_history_conflict",
    dependencies: {
      async transactWriteItems() {
        return { ok: true };
      },
    },
  });
} catch (error) {
  conflictCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260101", clothingIds: ["cl_404"] },
    headers: { "content-type": "application/json" },
    requestId: "req_history_not_found",
    dependencies: {
      async transactWriteItems() {
        const error = new Error("Transaction cancelled");
        error.name = "TransactionCanceledException";
        error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
        throw error;
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "API-14 handler validates request and returns 201 with historyId",
    ok:
      response.statusCode === 201
      && response.headers["content-type"]?.includes("application/json")
      && responseJson.historyId === "hs_00000000-0000-7000-8000-000000000000",
    detail: { response, responseJson },
  },
  {
    name: "API-14 handler executes usecase transact write for valid request",
    ok: createCalls.length === 1 && Array.isArray(createCalls[0]) && createCalls[0].length > 0,
    detail: createCalls,
  },
  {
    name: "API-14 handler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE",
    ok: unsupportedMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: unsupportedMediaTypeCode,
  },
  {
    name: "API-14 handler rejects invalid request body with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "API-14 handler maps duplicate clothingIds conflict to CONFLICT",
    ok: conflictCode === "CONFLICT",
    detail: conflictCode,
  },
  {
    name: "API-14 handler maps transact conditional check failure to NOT_FOUND",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports API-14 handler and package / CI wiring",
    ok:
      source.includes("export async function createHistoryHandler")
      && packageJson.includes('"test:history-ms5-api14-handler": "node --import tsx/esm scripts/check-history-ms5-api14-handler-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-ms5-api14-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T10 API-14 handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T10 API-14 handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
