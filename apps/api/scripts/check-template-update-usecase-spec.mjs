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

const updateCalls = [];
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
          name: "旧テンプレ",
          status: "ACTIVE",
          clothingIds: ["cl_001", "cl_002", "cl_003"],
          wearCount: 10,
          lastWornAt: 1735689600000,
          createdAt: 1735603200000,
          deletedAt: null,
          PK: "WARDROBE#wd_001",
          SK: "TEMPLATE#tp_001",
          statusListPk: "WARDROBE#wd_001#TEMPLATE#STATUS#ACTIVE",
          createdAtSk: "CREATED_AT#1735603200000#TEMPLATE#tp_001",
          wearCountSk: "WEAR_COUNT#0000000010#TEMPLATE#tp_001",
          lastWornAtSk: "LAST_WORN_AT#1735689600000#TEMPLATE#tp_001",
        },
      };
    },
    async update(input) {
      updateCalls.push(input);
      return { Attributes: input };
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds(input) {
      batchCalls.push(input);
      return [
        {
          Responses: {
            WardrobeTable: [
              { clothingId: "cl_001", imageKey: "img/1.jpg", status: "ACTIVE" },
              { clothingId: "cl_003", imageKey: null, status: "ACTIVE" },
            ],
          },
        },
      ];
    },
  },
});

await usecase.update({
  wardrobeId: "wd_001",
  templateId: "tp_001",
  name: "新テンプレ",
  clothingIds: ["cl_003", "cl_001"],
});

let duplicateCode = null;
try {
  await usecase.update({
    wardrobeId: "wd_001",
    templateId: "tp_001",
    clothingIds: ["cl_001", "cl_001"],
  });
} catch (error) {
  duplicateCode = error?.code ?? null;
}

let notFoundTemplateCode = null;
const missingTemplateUsecase = createTemplateUsecase({
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
    async update() {
      return {};
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});

try {
  await missingTemplateUsecase.update({
    wardrobeId: "wd_001",
    templateId: "tp_missing",
    name: "更新",
  });
} catch (error) {
  notFoundTemplateCode = error?.code ?? null;
}

let notFoundClothingCode = null;
const missingClothingUsecase = createTemplateUsecase({
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
          name: "旧テンプレ",
          status: "ACTIVE",
          clothingIds: ["cl_001"],
          wearCount: 1,
          lastWornAt: 1735689600000,
          createdAt: 1735603200000,
          deletedAt: null,
          PK: "WARDROBE#wd_001",
          SK: "TEMPLATE#tp_001",
          statusListPk: "WARDROBE#wd_001#TEMPLATE#STATUS#ACTIVE",
          createdAtSk: "CREATED_AT#1735603200000#TEMPLATE#tp_001",
          wearCountSk: "WEAR_COUNT#0000000001#TEMPLATE#tp_001",
          lastWornAtSk: "LAST_WORN_AT#1735689600000#TEMPLATE#tp_001",
        },
      };
    },
    async update() {
      return {};
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [{ clothingId: "cl_001", imageKey: null, status: "DELETED" }],
          },
        },
      ];
    },
  },
});

try {
  await missingClothingUsecase.update({
    wardrobeId: "wd_001",
    templateId: "tp_001",
    clothingIds: ["cl_001"],
  });
} catch (error) {
  notFoundClothingCode = error?.code ?? null;
}

const checks = [
  {
    name: "update usecase updates name and clothingIds while preserving given order",
    ok:
      updateCalls.length >= 1 &&
      updateCalls[0].name === "新テンプレ" &&
      updateCalls[0].clothingIds[0] === "cl_003" &&
      updateCalls[0].clothingIds[1] === "cl_001",
    detail: updateCalls,
  },
  {
    name: "update usecase validates referenced clothingIds by batch-get",
    ok:
      batchCalls.length >= 1 &&
      batchCalls[0].wardrobeId === "wd_001" &&
      batchCalls[0].clothingIds.length === 2,
    detail: batchCalls,
  },
  {
    name: "update usecase throws CONFLICT for duplicate clothingIds",
    ok: duplicateCode === "CONFLICT",
    detail: duplicateCode,
  },
  {
    name: "update usecase throws NOT_FOUND when target template does not exist",
    ok: notFoundTemplateCode === "NOT_FOUND",
    detail: notFoundTemplateCode,
  },
  {
    name: "update usecase throws NOT_FOUND when referenced clothing is not active",
    ok: notFoundClothingCode === "NOT_FOUND",
    detail: notFoundClothingCode,
  },
  {
    name: "source exports template update usecase and package / CI wiring",
    ok:
      source.includes("async update(input: UpdateTemplateUsecaseInput)") &&
      packageJson.includes('"test:template-update-usecase": "node --import tsx/esm scripts/check-template-update-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-update-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T08 template update usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T08 template update usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
