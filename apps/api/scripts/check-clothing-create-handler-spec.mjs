import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/createClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createClothingHandler } = await import(handlerModulePath);

const createCalls = [];
const response = await createClothingHandler({
  path: { wardrobeId: "wd_001" },
  body: { name: "白シャツ", genre: "tops", imageKey: "images/white-shirt.png" },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_create",
  dependencies: {
    repo: {
      async create(input) {
        createCalls.push(input);
        return { ok: true };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
    },
    now: () => 1_735_689_600_000,
    generateClothingId: () => "cl_00000000-0000-7000-8000-000000000000",
  },
});

let unsupportedMediaTypeCode = null;
try {
  await createClothingHandler({
    path: { wardrobeId: "wd_001" },
    body: { name: "白シャツ", genre: "tops" },
    headers: { "content-type": "text/plain" },
    requestId: "req_invalid_content_type",
  });
} catch (error) {
  unsupportedMediaTypeCode = error?.code ?? null;
}

let validationCode = null;
try {
  await createClothingHandler({
    path: { wardrobeId: "wd_001" },
    body: { name: " ", genre: "invalid" },
    headers: { "content-type": "application/json" },
    requestId: "req_invalid_body",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

const responseJson = JSON.parse(response.body);

const checks = [
  {
    name: "create handler validates body/path and returns 201 with clothingId",
    ok:
      response.statusCode === 201 &&
      response.headers["content-type"]?.includes("application/json") &&
      responseJson.clothingId === "cl_00000000-0000-7000-8000-000000000000",
    detail: { response, responseJson },
  },
  {
    name: "create handler forwards name/genre/imageKey and applies initial clothing state in usecase",
    ok:
      createCalls.length === 1 &&
      createCalls[0].wardrobeId === "wd_001" &&
      createCalls[0].name === "白シャツ" &&
      createCalls[0].genre === "tops" &&
      createCalls[0].imageKey === "images/white-shirt.png" &&
      createCalls[0].status === "ACTIVE" &&
      createCalls[0].wearCount === 0 &&
      createCalls[0].lastWornAt === 0 &&
      createCalls[0].createdAt === 1_735_689_600_000 &&
      createCalls[0].deletedAt === null,
    detail: createCalls,
  },
  {
    name: "create handler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE",
    ok: unsupportedMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: unsupportedMediaTypeCode,
  },
  {
    name: "create handler rejects invalid request body with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "source exports createClothingHandler plus package script / CI wiring",
    ok:
      source.includes("export async function createClothingHandler") &&
      packageJson.includes('"test:clothing-create-handler": "node --import tsx/esm scripts/check-clothing-create-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-create-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T05 clothing create handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T05 clothing create handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
