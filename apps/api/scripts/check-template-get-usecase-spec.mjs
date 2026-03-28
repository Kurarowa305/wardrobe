import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createTemplateUsecase } = await import(usecaseModulePath);

const batchCalls = [];
const usecase = createTemplateUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: undefined };
    },
    async create() {
      return {};
    },
    async get() {
      return {
        Item: {
          wardrobeId: "wd_001",
          templateId: "tp_001",
          name: "通勤",
          status: "ACTIVE",
          clothingIds: ["cl_001", "cl_002", "cl_003"],
          wearCount: 12,
          lastWornAt: 1735689600000,
          createdAt: 1735603200000,
          deletedAt: null,
          PK: "WARDROBE#wd_001",
          SK: "TEMPLATE#tp_001",
          statusListPk: "WARDROBE#wd_001#TEMPLATE#STATUS#ACTIVE",
          createdAtSk: "CREATED_AT#1735603200000#TEMPLATE#tp_001",
          wearCountSk: "WEAR_COUNT#0000000012#TEMPLATE#tp_001",
          lastWornAtSk: "LAST_WORN_AT#1735689600000#TEMPLATE#tp_001",
        },
      };
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds(input) {
      batchCalls.push(input);
      return [
        {
          Responses: {
            WardrobeTable: [
              {
                clothingId: "cl_003",
                name: "ローファー",
                genre: "others",
                imageKey: null,
                status: "DELETED",
                wearCount: 4,
                lastWornAt: 1735000000000,
              },
              {
                clothingId: "cl_001",
                name: "シャツ",
                genre: "tops",
                imageKey: "img/tops-1.jpg",
                status: "ACTIVE",
                wearCount: 10,
                lastWornAt: 1735689600000,
              },
              {
                clothingId: "cl_002",
                name: "パンツ",
                genre: "bottoms",
                imageKey: "img/bottoms-1.jpg",
                status: "ACTIVE",
                wearCount: 11,
                lastWornAt: 1735603200000,
              },
            ],
          },
        },
      ];
    },
  },
});

const result = await usecase.get({
  wardrobeId: "wd_001",
  templateId: "tp_001",
});

let notFoundCode = null;
const notFoundUsecase = createTemplateUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: undefined };
    },
    async create() {
      return {};
    },
    async get() {
      return { Item: undefined };
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});

try {
  await notFoundUsecase.get({
    wardrobeId: "wd_001",
    templateId: "tp_404",
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "get usecase returns template detail with ordered clothingItems",
    ok:
      result.name === "通勤" &&
      result.status === "ACTIVE" &&
      result.wearCount === 12 &&
      result.clothingItems.length === 3 &&
      result.clothingItems[0].clothingId === "cl_001" &&
      result.clothingItems[1].clothingId === "cl_002" &&
      result.clothingItems[2].clothingId === "cl_003",
    detail: result,
  },
  {
    name: "get usecase can include deleted clothing as status=DELETED",
    ok: result.clothingItems.some((item) => item.clothingId === "cl_003" && item.status === "DELETED"),
    detail: result,
  },
  {
    name: "get usecase reads template clothingIds through clothing batch-get",
    ok:
      batchCalls.length === 1 &&
      batchCalls[0].wardrobeId === "wd_001" &&
      batchCalls[0].clothingIds.length === 3,
    detail: batchCalls,
  },
  {
    name: "get usecase throws NOT_FOUND when template is missing",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports template get usecase and package / CI wiring",
    ok:
      source.includes("async get(input: GetTemplateUsecaseInput)") &&
      packageJson.includes('"test:template-get-usecase": "node --import tsx/esm scripts/check-template-get-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-get-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T07 template get usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T07 template get usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
