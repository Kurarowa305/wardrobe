import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const resolverModulePath = path.join(root, "src/domains/history/usecases/historyDetailsResolver.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(resolverModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryDetailsResolver } = await import(resolverModulePath);

const clothingBatchGetCalls = [];
const templateGetCalls = [];

const resolver = createHistoryDetailsResolver({
  clothingBatchGetRepo: {
    async batchGetByIds(input) {
      clothingBatchGetCalls.push(input);
      return [
        {
          Responses: {
            WardrobeTable: [
              {
                clothingId: "cl_01",
                name: "黒Tシャツ",
                genre: "tops",
                imageKey: "clothing/black.png",
                status: "ACTIVE",
                wearCount: 8,
                lastWornAt: 1735600000000,
              },
              {
                clothingId: "cl_02",
                name: "デニム",
                genre: "bottoms",
                imageKey: null,
                status: "DELETED",
                wearCount: 4,
                lastWornAt: 1735500000000,
              },
            ],
          },
        },
      ];
    },
  },
  templateRepo: {
    async get(input) {
      templateGetCalls.push(input);
      if (input.templateId === "tp_01") {
        return {
          Item: {
            templateId: "tp_01",
            name: "普段着",
          },
        };
      }

      return {
        Item: null,
      };
    },
  },
});

const histories = [
  {
    wardrobeId: "wd_01",
    historyId: "hs_01",
    date: "20260101",
    templateId: "tp_01",
    clothingIds: ["cl_02", "cl_01"],
    createdAt: 1735690000123,
  },
  {
    wardrobeId: "wd_01",
    historyId: "hs_02",
    date: "20260102",
    templateId: null,
    clothingIds: ["cl_999", "cl_01"],
    createdAt: 1735776400123,
  },
];

const resolvedMany = await resolver.resolveMany({
  wardrobeId: "wd_01",
  histories,
});

const resolvedOne = await resolver.resolveOne({
  wardrobeId: "wd_01",
  history: histories[0],
});

const checks = [
  {
    name: "resolveMany resolves template names, deleted clothing, and preserves clothingIds order",
    ok:
      resolvedMany[0]?.templateName === "普段着" &&
      resolvedMany[0]?.clothingItems.map((item) => item.clothingId).join(",") === "cl_02,cl_01" &&
      resolvedMany[0]?.clothingItems[0]?.status === "DELETED",
    detail: resolvedMany[0],
  },
  {
    name: "resolveMany drops unknown clothing IDs and returns null templateName for combination input",
    ok:
      resolvedMany[1]?.templateName === null &&
      resolvedMany[1]?.clothingItems.map((item) => item.clothingId).join(",") === "cl_01",
    detail: resolvedMany[1],
  },
  {
    name: "resolveMany calls clothing batchGet once with unique clothing IDs across histories",
    ok:
      clothingBatchGetCalls.length >= 1 &&
      clothingBatchGetCalls[0]?.wardrobeId === "wd_01" &&
      clothingBatchGetCalls[0]?.clothingIds.join(",") === "cl_02,cl_01,cl_999",
    detail: clothingBatchGetCalls,
  },
  {
    name: "resolveMany resolves only unique template IDs and resolveOne reuses same logic",
    ok:
      templateGetCalls.length === 2 &&
      templateGetCalls[0]?.templateId === "tp_01" &&
      clothingBatchGetCalls.length === 2 &&
      resolvedOne.templateName === "普段着" &&
      resolvedOne.clothingItems.map((item) => item.clothingId).join(",") === "cl_02,cl_01",
    detail: { templateGetCalls, resolvedOne },
  },
  {
    name: "source exports history details resolver and package / CI wiring include new spec",
    ok:
      source.includes("export function createHistoryDetailsResolver") &&
      packageJson.includes('"test:history-details-resolver": "node --import tsx/esm scripts/check-history-details-resolver-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-details-resolver") &&
      ciSource.includes("pnpm --filter api test:history-details-resolver"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T04 history details resolver spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T04 history details resolver spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
