import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/updateClothingHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { updateClothingHandler } = await import(handlerModulePath);

const updateCalls = [];
const okResponse = await updateClothingHandler({
  path: { wardrobeId: "wd_001", clothingId: "cl_001" },
  body: { name: "黒Tシャツ（夏用）", imageKey: "images/black-shirt-summer.png" },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_update",
  dependencies: {
    repo: {
      async get() {
        return {
          Item: {
            wardrobeId: "wd_001",
            clothingId: "cl_001",
            name: "黒Tシャツ",
            genre: "tops",
            imageKey: null,
            status: "ACTIVE",
            wearCount: 2,
            lastWornAt: 1_735_700_100_000,
            createdAt: 1_735_600_100_000,
            deletedAt: null,
          },
        };
      },
      async update(input) {
        updateCalls.push(input);
        return { Attributes: input };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
    },
  },
});

let validationCode = null;
try {
  await updateClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_001" },
    body: { name: "" },
    headers: { "content-type": "application/json" },
    requestId: "req_invalid",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let unsupportedMediaTypeCode = null;
try {
  await updateClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_001" },
    body: { name: "黒Tシャツ" },
    headers: { "content-type": "text/plain" },
    requestId: "req_bad_content_type",
  });
} catch (error) {
  unsupportedMediaTypeCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await updateClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_missing" },
    body: { name: "missing" },
    headers: { "content-type": "application/json" },
    requestId: "req_not_found",
    dependencies: {
      repo: {
        async get() {
          return { Item: undefined };
        },
        async update() {
          return { Attributes: {} };
        },
        async list() {
          return { Items: [], LastEvaluatedKey: null };
        },
        async create() {
          return { ok: true };
        },
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const okJson = JSON.parse(okResponse.body);

const checks = [
  {
    name: "update handler returns 200 and clothingId after partial update",
    ok:
      okResponse.statusCode === 200 &&
      okJson.clothingId === "cl_001" &&
      updateCalls.length === 1 &&
      updateCalls[0].name === "黒Tシャツ（夏用）" &&
      updateCalls[0].imageKey === "images/black-shirt-summer.png",
    detail: { okResponse, okJson, updateCalls },
  },
  {
    name: "update handler rejects invalid payload with VALIDATION_ERROR",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "update handler rejects unsupported content type with UNSUPPORTED_MEDIA_TYPE",
    ok: unsupportedMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: unsupportedMediaTypeCode,
  },
  {
    name: "update handler returns NOT_FOUND when clothing does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports updateClothingHandler plus package script / CI wiring",
    ok:
      source.includes("export async function updateClothingHandler") &&
      packageJson.includes('"test:clothing-update-handler": "node --import tsx/esm scripts/check-clothing-update-handler-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-update-handler"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T07 clothing update handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T07 clothing update handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
