import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const detailDtoModulePath = path.join(root, "src/domains/clothing/dto/clothingDetailDto.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const detailDtoSource = readFileSync(detailDtoModulePath, "utf8");
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
                PK: "W#wd_001#CLOTH",
                SK: "CLOTH#cl_003",
                wardrobeId: "wd_001",
                createdAt: 1734900000000,
                deletedAt: 1735800000000,
                statusListPk: "W#wd_001#CLOTH#DELETED",
                statusGenreListPk: "W#wd_001#CLOTH#DELETED#GENRE#others",
                createdAtSk: "CREATED#1734900000000#cl_003",
                wearCountSk: "WEAR#0000000004#cl_003",
                lastWornAtSk: "LASTWORN#1735000000000#cl_003",
              },
              {
                clothingId: "cl_001",
                name: "シャツ",
                genre: "tops",
                imageKey: "img/tops-1.jpg",
                status: "ACTIVE",
                wearCount: 10,
                lastWornAt: 1735689600000,
                PK: "W#wd_001#CLOTH",
                SK: "CLOTH#cl_001",
                wardrobeId: "wd_001",
                createdAt: 1735500000000,
                deletedAt: null,
                statusListPk: "W#wd_001#CLOTH#ACTIVE",
                statusGenreListPk: "W#wd_001#CLOTH#ACTIVE#GENRE#tops",
                createdAtSk: "CREATED#1735500000000#cl_001",
                wearCountSk: "WEAR#0000000010#cl_001",
                lastWornAtSk: "LASTWORN#1735689600000#cl_001",
              },
              {
                clothingId: "cl_002",
                name: "パンツ",
                genre: "bottoms",
                imageKey: "img/bottoms-1.jpg",
                status: "ACTIVE",
                wearCount: 11,
                lastWornAt: 1735603200000,
                PK: "W#wd_001#CLOTH",
                SK: "CLOTH#cl_002",
                wardrobeId: "wd_001",
                createdAt: 1735400000000,
                deletedAt: null,
                statusListPk: "W#wd_001#CLOTH#ACTIVE",
                statusGenreListPk: "W#wd_001#CLOTH#ACTIVE#GENRE#bottoms",
                createdAtSk: "CREATED#1735400000000#cl_002",
                wearCountSk: "WEAR#0000000011#cl_002",
                lastWornAtSk: "LASTWORN#1735603200000#cl_002",
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

const backwardCompatibleResult = await createTemplateUsecase({
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
          wardrobeId: "wd_legacy",
          templateId: "tp_legacy",
          name: "旧テンプレ",
          clothingIds: ["cl_legacy"],
        },
      };
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [
              {
                clothingId: "cl_legacy",
                name: "旧Tシャツ",
                genre: "tops",
                imageKey: null,
                status: "ACTIVE",
                wearCount: 2,
                lastWornAt: 1735000000000,
                PK: "W#wd_legacy#CLOTH",
                SK: "CLOTH#cl_legacy",
              },
            ],
          },
        },
      ];
    },
  },
}).get({
  wardrobeId: "wd_legacy",
  templateId: "tp_legacy",
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
      result.clothingItems[2].clothingId === "cl_003" &&
      !Object.hasOwn(result.clothingItems[0], "PK") &&
      !Object.hasOwn(result.clothingItems[0], "statusListPk"),
    detail: result,
  },
  {
    name: "get usecase can include deleted clothing as status=DELETED",
    ok: result.clothingItems.some((item) => item.clothingId === "cl_003" && item.status === "DELETED"),
    detail: result,
  },
  {
    name: "get usecase defaults missing template status and counters for backward compatibility",
    ok:
      backwardCompatibleResult.name === "旧テンプレ" &&
      backwardCompatibleResult.status === "ACTIVE" &&
      backwardCompatibleResult.wearCount === 0 &&
      backwardCompatibleResult.lastWornAt === 0,
    detail: backwardCompatibleResult,
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
      source.includes("toClothingDetailResponseDto") &&
      detailDtoSource.includes("export function toClothingDetailResponseDto") &&
      packageJson.includes('"test:template-get-usecase": "node --import tsx/esm scripts/check-template-get-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-get-usecase"),
    detail: { detailDtoSource, packageJson, ciSource },
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
