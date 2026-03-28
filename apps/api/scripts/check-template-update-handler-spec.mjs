import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/template/handlers/updateTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { updateTemplateHandler } = await import(handlerModulePath);

const updateCalls = [];
const response = await updateTemplateHandler({
  path: { wardrobeId: "wd_001", templateId: "tp_001" },
  body: { name: "春コーデ", clothingIds: ["cl_002", "cl_001"] },
  headers: { "content-type": "application/json" },
  requestId: "req_template_update_handler",
  dependencies: {
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
            name: "冬コーデ",
            status: "ACTIVE",
            clothingIds: ["cl_001", "cl_002"],
            wearCount: 3,
            lastWornAt: 1735689600000,
            createdAt: 1735603200000,
            deletedAt: null,
            PK: "WARDROBE#wd_001",
            SK: "TEMPLATE#tp_001",
            statusListPk: "WARDROBE#wd_001#TEMPLATE#STATUS#ACTIVE",
            createdAtSk: "CREATED_AT#1735603200000#TEMPLATE#tp_001",
            wearCountSk: "WEAR_COUNT#0000000003#TEMPLATE#tp_001",
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
      async batchGetByIds() {
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
  },
});

let validationErrorCode = null;
try {
  await updateTemplateHandler({
    path: { wardrobeId: "wd_001", templateId: "tp_001" },
    body: { name: "" },
    headers: { "content-type": "application/json" },
    requestId: "req_template_update_invalid",
  });
} catch (error) {
  validationErrorCode = error?.code ?? null;
}

let mediaTypeErrorCode = null;
try {
  await updateTemplateHandler({
    path: { wardrobeId: "wd_001", templateId: "tp_001" },
    body: { name: "春コーデ" },
    headers: { "content-type": "text/plain" },
    requestId: "req_template_update_invalid_content_type",
  });
} catch (error) {
  mediaTypeErrorCode = error?.code ?? null;
}

const checks = [
  {
    name: "update handler validates request and returns 204 No Content",
    ok: response.statusCode === 204,
    detail: response,
  },
  {
    name: "update handler delegates to usecase with parsed path/body",
    ok:
      updateCalls.length === 1 &&
      updateCalls[0].name === "春コーデ" &&
      updateCalls[0].clothingIds[0] === "cl_002",
    detail: updateCalls,
  },
  {
    name: "update handler rejects invalid body with VALIDATION_ERROR",
    ok: validationErrorCode === "VALIDATION_ERROR",
    detail: validationErrorCode,
  },
  {
    name: "update handler rejects unsupported content-type with UNSUPPORTED_MEDIA_TYPE",
    ok: mediaTypeErrorCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: mediaTypeErrorCode,
  },
  {
    name: "source exports updateTemplateHandler and package / CI wiring",
    ok:
      source.includes("export async function updateTemplateHandler") &&
      packageJson.includes('"test:template-update-handler": "node --import tsx/esm scripts/check-template-update-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-update-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T08 template update handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T08 template update handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
