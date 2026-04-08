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

const legacyItem = await createClothingUsecase({
  repo: {
    async get(input) {
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          clothingId: input.clothingId,
          name: "互換テスト服",
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

const deletedLegacyItem = await createClothingUsecase({
  repo: {
    async get(input) {
      return {
        Item: {
          wardrobeId: input.wardrobeId,
          clothingId: input.clothingId,
          name: "削除済み互換服",
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
}).get({ wardrobeId: "wd_legacy", clothingId: "cl_legacy_deleted" });

const checks = [
  {
    name: "legacy item defaults status/wearCount/lastWornAt in API-05 get",
    ok: legacyItem.status === "ACTIVE" && legacyItem.wearCount === 0 && legacyItem.lastWornAt === 0,
    detail: legacyItem,
  },
  {
    name: "legacy item keeps DELETED status and defaults missing counters",
    ok: deletedLegacyItem.status === "DELETED" && deletedLegacyItem.wearCount === 0 && deletedLegacyItem.lastWornAt === 0,
    detail: deletedLegacyItem,
  },
  {
    name: "source and package/CI wiring include backward compatibility path",
    ok:
      source.includes("extractClothingItemWithBackwardCompatibility") &&
      source.includes('status: isClothingStatus(detailCandidate.status) ? detailCandidate.status : "ACTIVE"') &&
      source.includes('wearCount: typeof detailCandidate.wearCount === "number" ? detailCandidate.wearCount : 0') &&
      source.includes('lastWornAt: typeof detailCandidate.lastWornAt === "number" ? detailCandidate.lastWornAt : 0') &&
      packageJson.includes('"test:clothing-get-backward-compat": "node --import tsx/esm scripts/check-clothing-get-backward-compat-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:clothing-get-backward-compat"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("API-05 backward compatibility spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("API-05 backward compatibility spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
