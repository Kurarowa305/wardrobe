import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createClothingUsecase } = await import(usecaseModulePath);

const repoCalls = [];
const usecase = createClothingUsecase({
  repo: {
    async get(input) {
      repoCalls.push(input);
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          clothingId: input.clothingId,
          name: "黒Tシャツ",
          genre: "tops",
          imageKey: null,
          status: "DELETED",
          wearCount: 12,
          lastWornAt: 1_735_690_000_123,
        },
      };
    },
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async create() {
      return { ok: true };
    },
  },
});

const result = await usecase.get({ wardrobeId: "wd_001", clothingId: "cl_001" });

const backwardCompatibleResult = await createClothingUsecase({
  repo: {
    async get(input) {
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          clothingId: input.clothingId,
          name: "白シャツ",
          genre: "tops",
          imageKey: null,
        },
      };
    },
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async create() {
      return { ok: true };
    },
  },
}).get({ wardrobeId: "wd_legacy", clothingId: "cl_legacy" });

const backwardCompatibleDeletedResult = await createClothingUsecase({
  repo: {
    async get(input) {
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          clothingId: input.clothingId,
          name: "古いコート",
          genre: "outer",
          imageKey: null,
          status: "DELETED",
        },
      };
    },
    async list() {
      return { Items: [], LastEvaluatedKey: null };
    },
    async create() {
      return { ok: true };
    },
  },
}).get({ wardrobeId: "wd_legacy", clothingId: "cl_deleted" });

let notFoundCode = null;
try {
  await createClothingUsecase({
    repo: {
      async get() {
        return { Item: undefined };
      },
      async list() {
        return { Items: [], LastEvaluatedKey: null };
      },
      async create() {
        return { ok: true };
      },
    },
  }).get({ wardrobeId: "wd_001", clothingId: "cl_missing" });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "get usecase calls repo.get by wardrobeId/clothingId",
    ok: repoCalls.length === 1 && repoCalls[0].wardrobeId === "wd_001" && repoCalls[0].clothingId === "cl_001",
    detail: repoCalls,
  },
  {
    name: "get usecase returns detail payload including status, wearCount, and lastWornAt",
    ok:
      result.clothingId === "cl_001" &&
      result.name === "黒Tシャツ" &&
      result.genre === "tops" &&
      result.imageKey === null &&
      result.status === "DELETED" &&
      result.wearCount === 12 &&
      result.lastWornAt === 1_735_690_000_123,
    detail: result,
  },
  {
    name: "get usecase throws NOT_FOUND when repo has no item",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "get usecase defaults status/wearCount/lastWornAt for backward compatibility",
    ok:
      backwardCompatibleResult.clothingId === "cl_legacy" &&
      backwardCompatibleResult.status === "ACTIVE" &&
      backwardCompatibleResult.wearCount === 0 &&
      backwardCompatibleResult.lastWornAt === 0,
    detail: backwardCompatibleResult,
  },
  {
    name: "get usecase keeps DELETED status while defaulting missing counters",
    ok:
      backwardCompatibleDeletedResult.clothingId === "cl_deleted" &&
      backwardCompatibleDeletedResult.status === "DELETED" &&
      backwardCompatibleDeletedResult.wearCount === 0 &&
      backwardCompatibleDeletedResult.lastWornAt === 0,
    detail: backwardCompatibleDeletedResult,
  },
  {
    name: "source exports get usecase flow plus package script / CI wiring",
    ok:
      source.includes("async get(input: GetClothingUsecaseInput)") &&
      source.includes("extractClothingItemWithBackwardCompatibility") &&
      packageJson.includes('"test:clothing-get-usecase": "node --import tsx/esm scripts/check-clothing-get-usecase-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-get-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T06 clothing get usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T06 clothing get usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
