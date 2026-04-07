import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const keyModulePath = path.join(root, "src/domains/clothing/repo/clothingKeys.ts");
const repoModulePath = path.join(root, "src/domains/clothing/repo/clothingRepo.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const keySource = readFileSync(keyModulePath, "utf8");
const repoSource = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const keyModule = await import(keyModulePath);
const repo = await import(repoModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);

const entity = {
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZBBB",
  name: "黒Tシャツ",
  genre: "tops",
  imageKey: "clothing/black_t.png",
  status: "ACTIVE",
  wearCount: 12,
  lastWornAt: 1735600000000,
  createdAt: 1735690000123,
  deletedAt: null,
};

const statusGenreListPk = keyModule.buildClothingStatusGenreListPk({
  wardrobeId: entity.wardrobeId,
  status: "ACTIVE",
  genre: entity.genre,
});
const item = repo.buildClothingItem(entity);

const mockDocumentClient = { send: async () => ({}) };
const repoClient = repo.createClothingRepo(createDynamoDbClient({
  endpoint: "http://localhost:8000",
  tableName: "SpecTable",
  documentClient: mockDocumentClient,
}));
const updateResult = await repoClient.update({ ...entity, genre: "bottoms" });
const deleteResult = await repoClient.delete({
  wardrobeId: entity.wardrobeId,
  clothingId: entity.clothingId,
  genre: "bottoms",
  deletedAt: 1735800000000,
});

const checks = [
  {
    name: "status+genre list key builder generates wardrobe/status/genre composite key",
    ok: statusGenreListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops",
    detail: statusGenreListPk,
  },
  {
    name: "buildClothingItem includes statusGenreListPk",
    ok: item.statusGenreListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops",
    detail: item,
  },
  {
    name: "repo update rewrites statusGenreListPk with current genre",
    ok:
      updateResult.operation === "UpdateItem" &&
      updateResult.request.input.UpdateExpression.includes("statusGenreListPk = :statusGenreListPk") &&
      updateResult.request.input.ExpressionAttributeValues[":statusGenreListPk"] ===
        "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#bottoms",
    detail: updateResult,
  },
  {
    name: "repo delete switches statusGenreListPk to DELETED partition with the current genre",
    ok:
      deleteResult.operation === "UpdateItem" &&
      deleteResult.request.input.ExpressionAttributeValues[":status"] === "DELETED" &&
      deleteResult.request.input.ExpressionAttributeValues[":statusGenreListPk"] ===
        "W#wd_01HZZAAA#CLOTH#DELETED#GENRE#bottoms",
    detail: deleteResult,
  },
  {
    name: "source and package / CI wiring include status+genre key coverage",
    ok:
      keySource.includes("buildClothingStatusGenreListPk") &&
      repoSource.includes("statusGenreListPk") &&
      packageJson.includes('"test:clothing-status-genre-key": "node --import tsx/esm scripts/check-clothing-status-genre-key-spec.mjs"') &&
      packageJson.includes("pnpm run test:clothing-status-genre-key") &&
      ciSource.includes("pnpm --filter api test:clothing-status-genre-key"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T10 clothing status+genre key spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T10 clothing status+genre key spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
