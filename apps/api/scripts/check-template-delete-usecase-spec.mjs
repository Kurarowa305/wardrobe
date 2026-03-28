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

const getCalls = [];
const deleteCalls = [];

const usecase = createTemplateUsecase({
  now: () => 1_736_000_000_000,
  repo: {
    async get(input) {
      getCalls.push(input);
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          templateId: input.templateId,
          name: "通勤",
          status: "ACTIVE",
          clothingIds: ["cl_001"],
          wearCount: 4,
          lastWornAt: 1_735_690_000_000,
          createdAt: 1_735_680_000_000,
          deletedAt: null,
        },
      };
    },
    async delete(input) {
      deleteCalls.push(input);
      return { ok: true };
    },
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async create() {
      return { ok: true };
    },
    async update() {
      return { ok: true };
    },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});

await usecase.delete({ wardrobeId: "wd_001", templateId: "tp_001" });

let notFoundCode = null;
try {
  await createTemplateUsecase({
    repo: {
      async get() {
        return { Item: undefined };
      },
      async delete() {
        return { ok: true };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
      async update() {
        return { ok: true };
      },
    },
    clothingBatchGetRepo: {
      async batchGetByIds() {
        return [];
      },
    },
  }).delete({ wardrobeId: "wd_001", templateId: "tp_missing" });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

let deletedStatusCode = null;
try {
  await createTemplateUsecase({
    repo: {
      async get(input) {
        return {
          Item: {
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
            name: "旧テンプレ",
            status: "DELETED",
            clothingIds: ["cl_001"],
            wearCount: 0,
            lastWornAt: 0,
            createdAt: 1_735_680_000_000,
            deletedAt: 1_735_690_000_000,
          },
        };
      },
      async delete() {
        return { ok: true };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
      async update() {
        return { ok: true };
      },
    },
    clothingBatchGetRepo: {
      async batchGetByIds() {
        return [];
      },
    },
  }).delete({ wardrobeId: "wd_001", templateId: "tp_deleted" });
} catch (error) {
  deletedStatusCode = error?.code ?? null;
}

const checks = [
  {
    name: "delete usecase fetches active template and performs logical delete with deletedAt",
    ok:
      getCalls.length === 1 &&
      deleteCalls.length === 1 &&
      deleteCalls[0].wardrobeId === "wd_001" &&
      deleteCalls[0].templateId === "tp_001" &&
      deleteCalls[0].deletedAt === 1_736_000_000_000,
    detail: { getCalls, deleteCalls },
  },
  {
    name: "delete usecase throws NOT_FOUND when template does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "delete usecase throws NOT_FOUND when template is already deleted",
    ok: deletedStatusCode === "NOT_FOUND",
    detail: deletedStatusCode,
  },
  {
    name: "source exports delete usecase flow plus package script / CI wiring",
    ok:
      source.includes("async delete(input: DeleteTemplateUsecaseInput)") &&
      packageJson.includes('"test:template-delete-usecase": "node --import tsx/esm scripts/check-template-delete-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-delete-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T09 template delete usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T09 template delete usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
