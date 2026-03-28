import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/template/handlers/deleteTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { deleteTemplateHandler } = await import(handlerModulePath);

const deleteCalls = [];
const response = await deleteTemplateHandler({
  path: { wardrobeId: "wd_001", templateId: "tp_001" },
  requestId: "req_delete_template",
  dependencies: {
    repo: {
      async get(input) {
        return {
          Item: {
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
            name: "通勤",
            status: "ACTIVE",
            clothingIds: ["cl_001"],
            wearCount: 1,
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
    now: () => 1_736_000_000_001,
  },
});

let validationCode = null;
try {
  await deleteTemplateHandler({
    path: { wardrobeId: " ", templateId: "tp_001" },
    requestId: "req_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await deleteTemplateHandler({
    path: { wardrobeId: "wd_001", templateId: "tp_missing" },
    requestId: "req_not_found",
    dependencies: {
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
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "delete handler returns 204 no-content",
    ok: response.statusCode === 204 && response.body === "",
    detail: response,
  },
  {
    name: "delete handler forwards delete input to usecase with wardrobeId/templateId",
    ok: deleteCalls.length === 1 && deleteCalls[0].wardrobeId === "wd_001" && deleteCalls[0].templateId === "tp_001",
    detail: deleteCalls,
  },
  {
    name: "delete handler rejects invalid path with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "delete handler returns NOT_FOUND when template does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports deleteTemplateHandler plus package script / CI wiring",
    ok:
      source.includes("export async function deleteTemplateHandler") &&
      packageJson.includes('"test:template-delete-handler": "node --import tsx/esm scripts/check-template-delete-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-delete-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T09 template delete handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T09 template delete handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
