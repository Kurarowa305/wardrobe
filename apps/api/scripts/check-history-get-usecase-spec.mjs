import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/history/usecases/historyUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryUsecase } = await import(usecaseModulePath);

const getCalls = [];
const resolveOneCalls = [];

const usecase = createHistoryUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async get(input) {
      getCalls.push(input);
      return {
        Item: {
          PK: "W#wd_001#HIST",
          SK: "HIST#hs_001",
          dateSk: "DATE#20260105#hs_001",
          wardrobeId: "wd_001",
          historyId: "hs_001",
          date: "20260105",
          templateId: "tp_001",
          clothingIds: ["cl_003", "cl_002"],
          createdAt: 1736100000000,
        },
      };
    },
  },
  historyDetailsResolver: {
    async resolveMany() {
      return [];
    },
    async resolveOne(input) {
      resolveOneCalls.push(input);
      return {
        historyId: "hs_001",
        date: "20260105",
        templateName: "出勤セット",
        clothingItems: [
          {
            clothingId: "cl_003",
            name: "ジャケット",
            genre: "tops",
            imageKey: "img/jacket.png",
            status: "ACTIVE",
            wearCount: 12,
            lastWornAt: 1736100000000,
          },
          {
            clothingId: "cl_002",
            name: "チノパン",
            genre: "bottoms",
            imageKey: null,
            status: "DELETED",
            wearCount: 7,
            lastWornAt: 1735900000000,
          },
        ],
      };
    },
  },
});

const result = await usecase.get({
  wardrobeId: "wd_001",
  historyId: "hs_001",
});

let notFoundCode = null;
const notFoundUsecase = createHistoryUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async get() {
      return { Item: undefined };
    },
  },
  historyDetailsResolver: {
    async resolveMany() {
      return [];
    },
    async resolveOne() {
      return {
        historyId: "hs_x",
        date: "20260101",
        templateName: null,
        clothingItems: [],
      };
    },
  },
});

try {
  await notFoundUsecase.get({
    wardrobeId: "wd_001",
    historyId: "hs_404",
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "get usecase fetches history by wardrobeId/historyId and resolves details",
    ok:
      getCalls.length === 1 &&
      getCalls[0].wardrobeId === "wd_001" &&
      getCalls[0].historyId === "hs_001" &&
      resolveOneCalls.length === 1 &&
      resolveOneCalls[0].wardrobeId === "wd_001" &&
      resolveOneCalls[0].history.historyId === "hs_001",
    detail: { getCalls, resolveOneCalls },
  },
  {
    name: "get usecase returns templateName and detailed clothingItems including deleted status",
    ok:
      result.date === "20260105" &&
      result.templateName === "出勤セット" &&
      result.clothingItems.length === 2 &&
      result.clothingItems[1].status === "DELETED" &&
      typeof result.clothingItems[0].wearCount === "number" &&
      typeof result.clothingItems[0].lastWornAt === "number",
    detail: result,
  },
  {
    name: "get usecase throws NOT_FOUND when history does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports history get usecase and package / CI wiring",
    ok:
      source.includes("async get(input: GetHistoryUsecaseInput)") &&
      packageJson.includes('"test:history-get-usecase": "node --import tsx/esm scripts/check-history-get-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:history-get-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T06 history get usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T06 history get usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
