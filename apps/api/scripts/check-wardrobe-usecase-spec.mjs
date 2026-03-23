import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/wardrobe/usecases/wardrobeUsecase.ts");
const errorsModulePath = path.join(root, "src/core/errors/index.ts");
const usecase = await import(usecaseModulePath);
const errors = await import(errorsModulePath);
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const generatedWardrobeId = usecase.generateWardrobeId();
const uuidPart = generatedWardrobeId.replace(/^wd_/, "");
const generatedUuid = usecase.generateUuidV7();

const createCalls = [];
const createUsecase = usecase.createWardrobeUsecase({
  repo: {
    async create(input) {
      createCalls.push(input);
      return { ok: true };
    },
    async get() {
      return { Item: undefined };
    },
  },
  now: () => 1735600000000,
  generateWardrobeId: () => "wd_018f05af-f4a8-7c90-9123-abcdef123456",
});

const createResult = await createUsecase.create({ name: "My Wardrobe" });

const detailUsecase = usecase.createWardrobeUsecase({
  repo: {
    async create() {
      return { ok: true };
    },
    async get() {
      return {
        Item: {
          PK: "W#wd_018f05af-f4a8-7c90-9123-abcdef123456",
          SK: "META",
          wardrobeId: "wd_018f05af-f4a8-7c90-9123-abcdef123456",
          name: "My Wardrobe",
          createdAt: 1735600000000,
        },
      };
    },
  },
});

const detailResult = await detailUsecase.get({ wardrobeId: "wd_018f05af-f4a8-7c90-9123-abcdef123456" });

const notFoundUsecase = usecase.createWardrobeUsecase({
  repo: {
    async create() {
      return { ok: true };
    },
    async get() {
      return {};
    },
  },
});

let notFoundError;
try {
  await notFoundUsecase.get({ wardrobeId: "wd_missing" });
} catch (error) {
  notFoundError = error;
}

assert.ok(notFoundError instanceof errors.AppError);
assert.equal(notFoundError.code, "NOT_FOUND");
assert.equal(notFoundError.status, 404);
assert.deepEqual(notFoundError.details, { resource: "wardrobe", wardrobeId: "wd_missing" });

const checks = [
  {
    name: "generateWardrobeId prefixes wd_ and uses UUIDv7",
    ok:
      /^wd_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(generatedWardrobeId) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuidPart) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(generatedUuid),
    detail: { generatedWardrobeId, generatedUuid },
  },
  {
    name: "create usecase generates wardrobeId and stores name/createdAt through repo",
    ok:
      createResult.wardrobeId === "wd_018f05af-f4a8-7c90-9123-abcdef123456" &&
      createCalls.length === 1 &&
      createCalls[0].wardrobeId === "wd_018f05af-f4a8-7c90-9123-abcdef123456" &&
      createCalls[0].name === "My Wardrobe" &&
      createCalls[0].createdAt === 1735600000000,
    detail: { createResult, createCalls },
  },
  {
    name: "get usecase returns wardrobe detail when repo returns META item",
    ok:
      detailResult.wardrobeId === "wd_018f05af-f4a8-7c90-9123-abcdef123456" &&
      detailResult.name === "My Wardrobe" &&
      detailResult.createdAt === 1735600000000,
    detail: detailResult,
  },
  {
    name: "get usecase throws NOT_FOUND when wardrobe is missing",
    ok:
      notFoundError instanceof errors.AppError &&
      notFoundError.code === "NOT_FOUND" &&
      notFoundError.status === 404 &&
      notFoundError.details?.resource === "wardrobe" &&
      notFoundError.details?.wardrobeId === "wd_missing",
    detail: notFoundError,
  },
  {
    name: "source exports wardrobe usecase and uuid helpers",
    ok:
      source.includes("export function generateUuidV7") &&
      source.includes("export function generateWardrobeId") &&
      source.includes("export function createWardrobeUsecase"),
  },
  {
    name: "package script and CI include wardrobe usecase spec test",
    ok:
      packageJson.includes('"test:wardrobe-usecase": "node --import tsx/esm scripts/check-wardrobe-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:wardrobe-usecase"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS1-T02 wardrobe usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS1-T02 wardrobe usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
