import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/template/handlers/createTemplateHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createTemplateHandler } = await import(handlerModulePath);

const createCalls = [];
const response = await createTemplateHandler({
  path: { wardrobeId: "wd_001" },
  body: { name: "仕事", clothingIds: ["cl_001", "cl_002"] },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_template_create_handler",
  dependencies: {
    repo: {
      async list() {
        return { Items: [], LastEvaluatedKey: undefined };
      },
      async create(input) {
        createCalls.push(input);
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
    generateTemplateId: () => "tp_001",
    now: () => 1735689600000,
  },
});

const responseJson = JSON.parse(response.body);

let invalidMediaTypeCode = null;
try {
  await createTemplateHandler({
    path: { wardrobeId: "wd_001" },
    body: { name: "仕事", clothingIds: ["cl_001"] },
    headers: { "content-type": "text/plain" },
    requestId: "req_template_invalid_media",
  });
} catch (error) {
  invalidMediaTypeCode = error?.code ?? null;
}

let invalidBodyCode = null;
try {
  await createTemplateHandler({
    path: { wardrobeId: "wd_001" },
    body: { name: "", clothingIds: [] },
    headers: { "content-type": "application/json" },
    requestId: "req_template_invalid_body",
  });
} catch (error) {
  invalidBodyCode = error?.code ?? null;
}

const checks = [
  {
    name: "create handler validates request and returns 201 with templateId",
    ok:
      response.statusCode === 201 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.templateId === "tp_001",
    detail: { response, responseJson },
  },
  {
    name: "create handler delegates to usecase dependencies with parsed body",
    ok:
      createCalls.length === 1 &&
      createCalls[0].wardrobeId === "wd_001" &&
      createCalls[0].name === "仕事" &&
      createCalls[0].clothingIds.length === 2,
    detail: createCalls,
  },
  {
    name: "create handler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE",
    ok: invalidMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: invalidMediaTypeCode,
  },
  {
    name: "create handler rejects invalid request body with VALIDATION_ERROR",
    ok: invalidBodyCode === "VALIDATION_ERROR",
    detail: invalidBodyCode,
  },
  {
    name: "source exports createTemplateHandler and package script / CI wiring",
    ok:
      source.includes("export async function createTemplateHandler") &&
      packageJson.includes('"test:template-create-handler": "node --import tsx/esm scripts/check-template-create-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:template-create-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T06 template create handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T06 template create handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
