import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/history/handlers/getHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { getHistoryHandler } = await import(handlerModulePath);

const response = await getHistoryHandler({
  path: { wardrobeId: "wd_001", historyId: "hs_001" },
  requestId: "req_history_get_handler",
  dependencies: {
    repo: {
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async get() {
        return {
          Item: {
            PK: "W#wd_001#HIST",
            SK: "HIST#hs_001",
            dateSk: "DATE#20260105#hs_001",
            wardrobeId: "wd_001",
            historyId: "hs_001",
            date: "20260105",
            templateId: null,
            clothingIds: ["cl_002"],
            createdAt: 1736100000000,
          },
        };
      },
    },
    historyDetailsResolver: {
      async resolveMany() {
        return [];
      },
      async resolveOne() {
        return {
          historyId: "hs_001",
          date: "20260105",
          templateName: null,
          clothingItems: [
            {
              clothingId: "cl_002",
              name: "黒デニム",
              genre: "bottoms",
              imageKey: null,
              status: "DELETED",
              wearCount: 5,
              lastWornAt: 1735900000000,
            },
          ],
        };
      },
    },
  },
});

const responseJson = JSON.parse(response.body);

let validationErrorCode = null;
try {
  await getHistoryHandler({
    path: { wardrobeId: "", historyId: "hs_001" },
    requestId: "req_history_get_invalid_path",
  });
} catch (error) {
  validationErrorCode = error?.code ?? null;
}

const checks = [
  {
    name: "get history handler validates path and returns 200 with detail payload",
    ok:
      response.statusCode === 200 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.date === "20260105" &&
      Array.isArray(responseJson.clothingItems),
    detail: { response, responseJson },
  },
  {
    name: "get history handler can return deleted clothing item with wear stats",
    ok:
      responseJson.clothingItems.some((item) => item.status === "DELETED") &&
      typeof responseJson.clothingItems[0]?.wearCount === "number" &&
      typeof responseJson.clothingItems[0]?.lastWornAt === "number",
    detail: responseJson,
  },
  {
    name: "get history handler rejects invalid path with VALIDATION_ERROR",
    ok: validationErrorCode === "VALIDATION_ERROR",
    detail: validationErrorCode,
  },
  {
    name: "source exports getHistoryHandler and package / CI wiring",
    ok:
      source.includes("export async function getHistoryHandler") &&
      packageJson.includes('"test:history-get-handler": "node --import tsx/esm scripts/check-history-get-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:history-get-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T06 history get handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T06 history get handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
