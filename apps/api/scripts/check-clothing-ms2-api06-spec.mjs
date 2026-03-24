import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/clothing/handlers/updateClothingHandler.ts");
const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const adapterModulePath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const handlerSource = readFileSync(handlerModulePath, "utf8");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const adapterSource = readFileSync(adapterModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { updateClothingHandler } = await import(handlerModulePath);

const getCalls = [];
const updateCalls = [];
const noContentResponse = await updateClothingHandler({
  path: { wardrobeId: "wd_001", clothingId: "cl_001" },
  body: { genre: "bottoms", imageKey: null },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_update",
  dependencies: {
    repo: {
      async get(input) {
        getCalls.push(input);
        return {
          Item: {
            wardrobeId: input.wardrobeId,
            clothingId: input.clothingId,
            name: "黒Tシャツ",
            genre: "tops",
            imageKey: "images/old.png",
            status: "ACTIVE",
            wearCount: 4,
            lastWornAt: 1_735_690_000_000,
            createdAt: 1_735_680_000_000,
            deletedAt: null,
          },
        };
      },
      async update(input) {
        updateCalls.push(input);
        return { ok: true };
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

let unsupportedMediaTypeCode = null;
try {
  await updateClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_001" },
    body: { name: "白シャツ" },
    headers: { "content-type": "text/plain" },
    requestId: "req_invalid_content_type",
  });
} catch (error) {
  unsupportedMediaTypeCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await updateClothingHandler({
    path: { wardrobeId: "wd_001", clothingId: "cl_missing" },
    body: { name: "白シャツ" },
    headers: { "content-type": "application/json" },
    requestId: "req_not_found",
    dependencies: {
      repo: {
        async get() {
          return { Item: undefined };
        },
        async update() {
          return { ok: true };
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

const checks = [
  {
    name: "update handler returns 204 no-content",
    ok: noContentResponse.statusCode === 204 && noContentResponse.body === "",
    detail: noContentResponse,
  },
  {
    name: "update usecase merges partial payload and updates genre/imageKey while preserving name",
    ok:
      getCalls.length === 1 &&
      updateCalls.length === 1 &&
      updateCalls[0].wardrobeId === "wd_001" &&
      updateCalls[0].clothingId === "cl_001" &&
      updateCalls[0].name === "黒Tシャツ" &&
      updateCalls[0].genre === "bottoms" &&
      updateCalls[0].imageKey === null,
    detail: { getCalls, updateCalls },
  },
  {
    name: "update handler rejects non-json content type with UNSUPPORTED_MEDIA_TYPE",
    ok: unsupportedMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: unsupportedMediaTypeCode,
  },
  {
    name: "update handler returns NOT_FOUND when target clothing does not exist",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source exports API-06 update flow and package / CI wiring",
    ok:
      handlerSource.includes("export async function updateClothingHandler") &&
      usecaseSource.includes("async update(input: UpdateClothingUsecaseInput)") &&
      adapterSource.includes("updateClothingHandler") &&
      packageJson.includes('"test:clothing-ms2-api06": "node --import tsx/esm scripts/check-clothing-ms2-api06-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-ms2-api06"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T07 clothing API-06 aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T07 clothing API-06 aggregate spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
