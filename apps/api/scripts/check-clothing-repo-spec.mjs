import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/clothing/repo/clothingRepo.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const repo = await import(repoModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);
const mockDocumentClient = { send: async () => ({}) };

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

const item = repo.buildClothingItem(entity);
const activeListPk = repo.buildClothingListKey({ wardrobeId: entity.wardrobeId });
const deletedListPk = repo.buildClothingListKey({ wardrobeId: entity.wardrobeId, status: "DELETED" });
const repoClient = repo.createClothingRepo(createDynamoDbClient({
  endpoint: "http://localhost:8000",
  tableName: "SpecTable",
  documentClient: mockDocumentClient,
}));
const createResult = await repoClient.create(entity);
const getResult = await repoClient.get({ wardrobeId: entity.wardrobeId, clothingId: entity.clothingId });
const listResult = await repoClient.list({
  wardrobeId: entity.wardrobeId,
  indexName: repo.clothingListIndexNames.wearCount,
  limit: 20,
  scanIndexForward: false,
  exclusiveStartKey: { PK: item.PK, SK: item.SK, statusListPk: item.statusListPk, wearCountSk: item.wearCountSk },
});
const genreListResult = await repoClient.list({
  wardrobeId: entity.wardrobeId,
  indexName: repo.clothingListIndexNames.statusGenreCreatedAt,
  genre: "tops",
  limit: 20,
  scanIndexForward: false,
  exclusiveStartKey: {
    PK: item.PK,
    SK: item.SK,
    statusGenreListPk: item.statusGenreListPk,
    createdAtSk: item.createdAtSk,
  },
});
const updateResult = await repoClient.update({ ...entity, wearCount: 13, lastWornAt: 1735700000000 });
const deleteResult = await repoClient.delete({
  wardrobeId: entity.wardrobeId,
  clothingId: entity.clothingId,
  genre: entity.genre,
  deletedAt: 1735800000000,
});

const checks = [
  {
    name: "buildClothingItem adds base and GSI key attributes to the entity payload",
    ok:
      item.PK === "W#wd_01HZZAAA#CLOTH" &&
      item.SK === "CLOTH#cl_01HZZBBB" &&
      item.statusListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE" &&
      item.statusGenreListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops" &&
      item.createdAtSk === "CREATED#1735690000123#cl_01HZZBBB" &&
      item.wearCountSk === "WEAR#0000000012#cl_01HZZBBB" &&
      item.lastWornAtSk === "LASTWORN#1735600000000#cl_01HZZBBB",
    detail: item,
  },
  {
    name: "buildClothingListKey defaults to ACTIVE and can target DELETED status lists",
    ok:
      activeListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE" &&
      deletedListPk === "W#wd_01HZZAAA#CLOTH#DELETED",
    detail: { activeListPk, deletedListPk },
  },
  {
    name: "repo create stores the full clothing item with duplicate guard",
    ok:
      createResult.operation === "PutItem" &&
      createResult.request.input.TableName === "SpecTable" &&
      createResult.request.input.Item.statusListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE" &&
      createResult.request.input.Item.statusGenreListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops" &&
      createResult.request.input.Item.wearCountSk === "WEAR#0000000012#cl_01HZZBBB" &&
      createResult.request.input.ConditionExpression === "attribute_not_exists(PK)",
    detail: createResult,
  },
  {
    name: "repo get performs a consistent lookup on the clothing base key",
    ok:
      getResult.operation === "GetItem" &&
      getResult.request.input.Key.PK === "W#wd_01HZZAAA#CLOTH" &&
      getResult.request.input.Key.SK === "CLOTH#cl_01HZZBBB" &&
      getResult.request.input.ConsistentRead === true,
    detail: getResult,
  },
  {
    name: "repo list queries a status GSI and only targets ACTIVE items by default",
    ok:
      listResult.operation === "Query" &&
      listResult.request.input.IndexName === "StatusListByWearCount" &&
      listResult.request.input.KeyConditionExpression === "#statusListPk = :statusListPk" &&
      listResult.request.input.ExpressionAttributeValues[":statusListPk"] === "W#wd_01HZZAAA#CLOTH#ACTIVE" &&
      listResult.request.input.ScanIndexForward === false &&
      listResult.request.input.Limit === 20 &&
      listResult.request.input.ExclusiveStartKey.wearCountSk === "WEAR#0000000012#cl_01HZZBBB",
    detail: listResult,
  },
  {
    name: "repo list can query status+genre GSI when index and genre are specified",
    ok:
      genreListResult.operation === "Query" &&
      genreListResult.request.input.IndexName === "StatusGenreListByCreatedAt" &&
      genreListResult.request.input.KeyConditionExpression === "#statusGenreListPk = :statusGenreListPk" &&
      genreListResult.request.input.ExpressionAttributeValues[":statusGenreListPk"] === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops" &&
      genreListResult.request.input.ExclusiveStartKey.createdAtSk === "CREATED#1735690000123#cl_01HZZBBB",
    detail: genreListResult,
  },
  {
    name: "repo update rewrites editable fields and all GSI attributes in one UpdateItem",
    ok:
      updateResult.operation === "UpdateItem" &&
      updateResult.request.input.ConditionExpression === "attribute_exists(PK)" &&
      updateResult.request.input.ReturnValues === "ALL_NEW" &&
      updateResult.request.input.UpdateExpression.includes("statusListPk = :statusListPk") &&
      updateResult.request.input.UpdateExpression.includes("statusGenreListPk = :statusGenreListPk") &&
      updateResult.request.input.UpdateExpression.includes("wearCountSk = :wearCountSk") &&
      updateResult.request.input.ExpressionAttributeValues[":wearCount"] === 13 &&
      updateResult.request.input.ExpressionAttributeValues[":lastWornAtSk"] === "LASTWORN#1735700000000#cl_01HZZBBB",
    detail: updateResult,
  },
  {
    name: "repo delete performs logical deletion by switching status, deletedAt, and list partition keys",
    ok:
      deleteResult.operation === "UpdateItem" &&
      deleteResult.request.input.UpdateExpression === "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk, statusGenreListPk = :statusGenreListPk" &&
      deleteResult.request.input.ExpressionAttributeValues[":status"] === "DELETED" &&
      deleteResult.request.input.ExpressionAttributeValues[":deletedAt"] === 1735800000000 &&
      deleteResult.request.input.ExpressionAttributeValues[":statusListPk"] === "W#wd_01HZZAAA#CLOTH#DELETED" &&
      deleteResult.request.input.ExpressionAttributeValues[":statusGenreListPk"] === "W#wd_01HZZAAA#CLOTH#DELETED#GENRE#tops",
    detail: deleteResult,
  },
  {
    name: "source exports clothing repo helpers plus package script and CI wiring",
    ok:
      source.includes("export function buildClothingItem") &&
      source.includes("export function buildClothingListKey") &&
      source.includes("export function createClothingRepo") &&
      packageJson.includes('"test:clothing-repo": "node --import tsx/esm scripts/check-clothing-repo-spec.mjs"') &&
      packageJson.includes("pnpm run test:clothing-repo") &&
      ciSource.includes("pnpm --filter api test:clothing-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T03 clothing repo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T03 clothing repo spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
