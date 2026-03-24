import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/template/repo/templateRepo.ts");
const dynamoModulePath = path.join(root, "src/clients/dynamodb.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const repo = await import(repoModulePath);
const { createDynamoDbClient } = await import(dynamoModulePath);

const entity = {
  wardrobeId: "wd_01HZZAAA",
  templateId: "tpl_01HZZBBB",
  name: "通勤テンプレ",
  status: "ACTIVE",
  clothingIds: ["cl_01", "cl_02", "cl_03"],
  wearCount: 12,
  lastWornAt: 1735600000000,
  createdAt: 1735690000123,
  deletedAt: null,
};

const item = repo.buildTemplateItem(entity);
const activeListPk = repo.buildTemplateListKey({ wardrobeId: entity.wardrobeId });
const deletedListPk = repo.buildTemplateListKey({ wardrobeId: entity.wardrobeId, status: "DELETED" });
const repoClient = repo.createTemplateRepo(createDynamoDbClient({ endpoint: "http://localhost:8000", tableName: "SpecTable" }));
const createResult = await repoClient.create(entity);
const getResult = await repoClient.get({ wardrobeId: entity.wardrobeId, templateId: entity.templateId });
const listResult = await repoClient.list({
  wardrobeId: entity.wardrobeId,
  indexName: repo.templateListIndexNames.wearCount,
  limit: 20,
  scanIndexForward: false,
  exclusiveStartKey: { PK: item.PK, SK: item.SK, statusListPk: item.statusListPk, wearCountSk: item.wearCountSk },
});
const updateResult = await repoClient.update({ ...entity, clothingIds: ["cl_01", "cl_04"], wearCount: 13, lastWornAt: 1735700000000 });
const deleteResult = await repoClient.delete({ wardrobeId: entity.wardrobeId, templateId: entity.templateId, deletedAt: 1735800000000 });

const checks = [
  {
    name: "buildTemplateItem adds base and GSI key attributes to the entity payload",
    ok:
      item.PK === "W#wd_01HZZAAA#TPL" &&
      item.SK === "TPL#tpl_01HZZBBB" &&
      item.statusListPk === "W#wd_01HZZAAA#TPL#ACTIVE" &&
      item.createdAtSk === "CREATED#1735690000123#tpl_01HZZBBB" &&
      item.wearCountSk === "WEAR#0000000012#tpl_01HZZBBB" &&
      item.lastWornAtSk === "LASTWORN#1735600000000#tpl_01HZZBBB",
    detail: item,
  },
  {
    name: "buildTemplateListKey defaults to ACTIVE and can target DELETED status lists",
    ok:
      activeListPk === "W#wd_01HZZAAA#TPL#ACTIVE" &&
      deletedListPk === "W#wd_01HZZAAA#TPL#DELETED",
    detail: { activeListPk, deletedListPk },
  },
  {
    name: "repo create stores the full template item with duplicate guard",
    ok:
      createResult.operation === "PutItem" &&
      createResult.request.input.TableName === "SpecTable" &&
      createResult.request.input.Item.statusListPk === "W#wd_01HZZAAA#TPL#ACTIVE" &&
      createResult.request.input.Item.wearCountSk === "WEAR#0000000012#tpl_01HZZBBB" &&
      createResult.request.input.ConditionExpression === "attribute_not_exists(PK)",
    detail: createResult,
  },
  {
    name: "repo get performs a consistent lookup on the template base key",
    ok:
      getResult.operation === "GetItem" &&
      getResult.request.input.Key.PK === "W#wd_01HZZAAA#TPL" &&
      getResult.request.input.Key.SK === "TPL#tpl_01HZZBBB" &&
      getResult.request.input.ConsistentRead === true,
    detail: getResult,
  },
  {
    name: "repo list queries a status GSI and only targets ACTIVE items by default",
    ok:
      listResult.operation === "Query" &&
      listResult.request.input.IndexName === "StatusListByWearCount" &&
      listResult.request.input.KeyConditionExpression === "#statusListPk = :statusListPk" &&
      listResult.request.input.ExpressionAttributeValues[":statusListPk"] === "W#wd_01HZZAAA#TPL#ACTIVE" &&
      listResult.request.input.ScanIndexForward === false &&
      listResult.request.input.Limit === 20 &&
      listResult.request.input.ExclusiveStartKey.wearCountSk === "WEAR#0000000012#tpl_01HZZBBB",
    detail: listResult,
  },
  {
    name: "repo update rewrites clothingIds and all GSI attributes in one UpdateItem",
    ok:
      updateResult.operation === "UpdateItem" &&
      updateResult.request.input.ConditionExpression === "attribute_exists(PK)" &&
      updateResult.request.input.ReturnValues === "ALL_NEW" &&
      updateResult.request.input.UpdateExpression.includes("clothingIds = :clothingIds") &&
      updateResult.request.input.UpdateExpression.includes("statusListPk = :statusListPk") &&
      updateResult.request.input.UpdateExpression.includes("wearCountSk = :wearCountSk") &&
      updateResult.request.input.ExpressionAttributeValues[":wearCount"] === 13 &&
      Array.isArray(updateResult.request.input.ExpressionAttributeValues[":clothingIds"]) &&
      updateResult.request.input.ExpressionAttributeValues[":lastWornAtSk"] === "LASTWORN#1735700000000#tpl_01HZZBBB",
    detail: updateResult,
  },
  {
    name: "repo delete performs logical deletion by switching status, deletedAt, and statusListPk",
    ok:
      deleteResult.operation === "UpdateItem" &&
      deleteResult.request.input.UpdateExpression === "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk" &&
      deleteResult.request.input.ExpressionAttributeValues[":status"] === "DELETED" &&
      deleteResult.request.input.ExpressionAttributeValues[":deletedAt"] === 1735800000000 &&
      deleteResult.request.input.ExpressionAttributeValues[":statusListPk"] === "W#wd_01HZZAAA#TPL#DELETED",
    detail: deleteResult,
  },
  {
    name: "source exports template repo helpers plus package script and CI wiring",
    ok:
      source.includes("export function buildTemplateItem") &&
      source.includes("export function buildTemplateListKey") &&
      source.includes("export function createTemplateRepo") &&
      packageJson.includes('"test:template-repo": "node --import tsx/esm scripts/check-template-repo-spec.mjs"') &&
      packageJson.includes("pnpm run test:template-repo") &&
      ciSource.includes("pnpm --filter api test:template-repo"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T03 template repo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T03 template repo spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
