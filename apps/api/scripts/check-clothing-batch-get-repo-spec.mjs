import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/clothing/repo/clothingBatchGetRepo.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const source = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const repo = await import(repoModulePath);

const wardrobeId = "wd_01HZZAAA";
const clothingIds = Array.from({ length: 162 }, (_, index) => `cl_${String(index + 1).padStart(3, "0")}`);

const chunks = repo.splitClothingIdsForBatchGet(clothingIds);
const keys = repo.buildClothingBatchGetKeys({
  wardrobeId,
  clothingIds: clothingIds.slice(0, 3),
});
const reordered = repo.reorderClothingItemsByIds(
  ["cl_002", "cl_001", "cl_004"],
  [
    { clothingId: "cl_001", name: "shirt" },
    { clothingId: "cl_002", name: "pants" },
    { clothingId: "cl_003", name: "hat" },
  ],
);

const client = {
  batchGetItemCalls: [],
  async batchGetItem(input) {
    this.batchGetItemCalls.push(input);
    return {
      operation: "BatchGetItem",
      request: {
        operation: "BatchGetItem",
        region: "ap-northeast-1",
        input: {
          RequestItems: {
            SpecTable: {
              Keys: input.Keys,
              ConsistentRead: input.ConsistentRead,
            },
          },
        },
      },
    };
  },
};

const repoClient = repo.createClothingBatchGetRepo(client);
const batchResults = await repoClient.batchGetByIds({
  wardrobeId,
  clothingIds,
});

const checks = [
  {
    name: "chunk helper splits clothingIds by 80 items",
    ok: chunks.length === 3 && chunks[0].length === 80 && chunks[1].length === 80 && chunks[2].length === 2,
    detail: chunks.map((chunk) => chunk.length),
  },
  {
    name: "key helper builds clothing base keys from wardrobeId and clothingIds",
    ok:
      keys.length === 3 &&
      keys[0].PK === "W#wd_01HZZAAA#CLOTH" &&
      keys[0].SK === "CLOTH#cl_001" &&
      keys[2].SK === "CLOTH#cl_003",
    detail: keys,
  },
  {
    name: "reorder helper keeps clothingIds order and filters missing items",
    ok: reordered.length === 2 && reordered[0].clothingId === "cl_002" && reordered[1].clothingId === "cl_001",
    detail: reordered,
  },
  {
    name: "repo batchGetByIds calls BatchGetItem in 80-item chunks with consistent read",
    ok:
      batchResults.length === 3 &&
      client.batchGetItemCalls.length === 3 &&
      client.batchGetItemCalls.every((call) => call.ConsistentRead === true) &&
      client.batchGetItemCalls[0].Keys.length === 80 &&
      client.batchGetItemCalls[1].Keys.length === 80 &&
      client.batchGetItemCalls[2].Keys.length === 2 &&
      client.batchGetItemCalls[0].Keys[0].PK === "W#wd_01HZZAAA#CLOTH" &&
      client.batchGetItemCalls[2].Keys[1].SK === "CLOTH#cl_162",
    detail: client.batchGetItemCalls,
  },
  {
    name: "source, package script and CI include clothing batch-get repo spec",
    ok:
      source.includes("export const CLOTHING_BATCH_GET_CHUNK_SIZE = 80") &&
      source.includes("export function reorderClothingItemsByIds") &&
      source.includes("export function createClothingBatchGetRepo") &&
      packageJson.includes('"test:clothing-batch-get-repo": "node --import tsx/esm scripts/check-clothing-batch-get-repo-spec.mjs"') &&
      packageJson.includes("pnpm run test:clothing-batch-get-repo") &&
      ciSource.includes("pnpm --filter api test:clothing-batch-get-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T04 clothing batch-get repo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T04 clothing batch-get repo spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
