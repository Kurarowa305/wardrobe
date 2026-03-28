import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createErrorResponse } from "../src/core/response/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/history/handlers/deleteHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { deleteHistoryHandler } = await import(handlerModulePath);

const deleteCalls = [];
const response = await deleteHistoryHandler({
  path: { wardrobeId: "wd_001", historyId: "hs_001" },
  requestId: "req_history_delete",
  dependencies: {
    async getHistory() {
      return {
        Item: {
          wardrobeId: "wd_001",
          historyId: "hs_001",
          date: "20260105",
          templateId: null,
          clothingIds: ["cl_001"],
          createdAt: 1736035200000,
        },
      };
    },
    async batchGetClothingByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [{ clothingId: "cl_001", wearCount: 1, lastWornAt: Date.UTC(2026, 0, 5, 0, 0, 0, 0) }],
          },
        },
      ];
    },
    async getWearDailyCount() {
      return 1;
    },
    async findLatestBeforeDate() {
      return null;
    },
    async transactWriteItems(items) {
      deleteCalls.push(items);
      return { ok: true };
    },
  },
});

let validationCode = null;
try {
  await deleteHistoryHandler({
    path: { wardrobeId: "wd_001", historyId: "" },
    requestId: "req_history_delete_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await deleteHistoryHandler({
    path: { wardrobeId: "wd_001", historyId: "hs_missing" },
    requestId: "req_history_delete_missing",
    dependencies: {
      async getHistory() {
        return {};
      },
      async transactWriteItems() {
        return { ok: true };
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

let internalStatus = null;
let internalCode = null;
try {
  await deleteHistoryHandler({
    path: { wardrobeId: "wd_001", historyId: "hs_001" },
    requestId: "req_history_delete_internal",
    dependencies: {
      async getHistory() {
        throw new Error("boom");
      },
    },
  });
} catch (error) {
  const errorResponse = createErrorResponse(error, { requestId: "req_history_delete_internal" });
  internalStatus = errorResponse.statusCode;
  internalCode = errorResponse.json.error.code;
}

const checks = [
  {
    name: "API-16 handler validates path and returns 204",
    ok: response.statusCode === 204 && response.body === "",
    detail: response,
  },
  {
    name: "API-16 handler executes delete usecase transaction",
    ok: deleteCalls.length === 1 && Array.isArray(deleteCalls[0]) && deleteCalls[0].length > 0,
    detail: deleteCalls,
  },
  {
    name: "API-16 handler rejects invalid path with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "API-16 handler maps missing history to NOT_FOUND",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "API-16 handler maps unknown failure to INTERNAL_ERROR(500) via error response",
    ok: internalStatus === 500 && internalCode === "INTERNAL_ERROR",
    detail: { internalStatus, internalCode },
  },
  {
    name: "source exports API-16 handler and package / CI wiring",
    ok:
      source.includes("export async function deleteHistoryHandler")
      && packageJson.includes('"test:history-ms5-api16-handler": "node --import tsx/esm scripts/check-history-ms5-api16-handler-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-ms5-api16-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T12 API-16 handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T12 API-16 handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
