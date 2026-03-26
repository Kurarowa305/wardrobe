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

const createCalls = [];
const batchCalls = [];
const usecase = createTemplateUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: undefined };
    },
    async create(input) {
      createCalls.push(input);
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
              { clothingId: "cl_001", imageKey: null, status: "ACTIVE" },
              { clothingId: "cl_002", imageKey: "img/2.jpg", status: "ACTIVE" },
            ],
          },
        },
      ];
    },
  },
  generateTemplateId: () => "tp_custom",
  now: () => 1735689600000,
});

const created = await usecase.create({
  wardrobeId: "wd_001",
  name: "出勤コーデ",
  clothingIds: ["cl_001", "cl_002"],
});

let duplicateCode = null;
try {
  await usecase.create({
    wardrobeId: "wd_001",
    name: "重複",
    clothingIds: ["cl_001", "cl_001"],
  });
} catch (error) {
  duplicateCode = error?.code ?? null;
}

let notFoundCode = null;
const missingUsecase = createTemplateUsecase({
  repo: {
    async list() {
      return { Items: [], LastEvaluatedKey: undefined };
    },
    async create() {
      return {};
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [
              { clothingId: "cl_001", imageKey: null, status: "ACTIVE" },
            ],
          },
        },
      ];
    },
  },
});

try {
  await missingUsecase.create({
    wardrobeId: "wd_001",
    name: "不足",
    clothingIds: ["cl_001", "cl_999"],
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "create usecase validates duplicate clothingIds and throws CONFLICT",
    ok: duplicateCode === "CONFLICT",
    detail: duplicateCode,
  },
  {
    name: "create usecase verifies referenced clothing existence and throws NOT_FOUND",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "create usecase persists generated template entity and returns templateId",
    ok:
      created.templateId === "tp_custom" &&
      createCalls.length === 1 &&
      createCalls[0].templateId === "tp_custom" &&
      createCalls[0].status === "ACTIVE" &&
      createCalls[0].wearCount === 0 &&
      createCalls[0].lastWornAt === 0 &&
      createCalls[0].createdAt === 1735689600000,
    detail: { created, createCalls },
  },
  {
    name: "create usecase reads all reference clothingIds through batch-get",
    ok:
      batchCalls.length === 1 &&
      batchCalls[0].wardrobeId === "wd_001" &&
      batchCalls[0].clothingIds.length === 2,
    detail: batchCalls,
  },
  {
    name: "source exports template create usecase and package script / CI wiring",
    ok:
      source.includes("async create(input: CreateTemplateUsecaseInput)") &&
      packageJson.includes('"test:template-create-usecase": "node --import tsx/esm scripts/check-template-create-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-create-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T06 template create usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T06 template create usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
