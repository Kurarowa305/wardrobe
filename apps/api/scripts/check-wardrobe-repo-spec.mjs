import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const repoModulePath = path.join(root, "src/domains/wardrobe/repo/wardrobeRepo.ts");
const repo = await import(repoModulePath);
const source = readFileSync(repoModulePath, "utf8");
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");
const mockDocumentClient = { send: async () => ({}) };

const builtKey = repo.buildWardrobeMetaKey("wd_01HZZ8ABCDEF1234567890");
const builtItem = repo.buildWardrobeMetaItem({
  wardrobeId: "wd_01HZZ8ABCDEF1234567890",
  name: "My Wardrobe",
  createdAt: 1735600000000,
});

const repoClient = repo.createWardrobeRepo(
  (await import(path.join(root, "src/clients/dynamodb.ts"))).createDynamoDbClient({
    endpoint: "http://localhost:8000",
    tableName: "SpecTable",
    documentClient: mockDocumentClient,
  }),
);

const createResult = await repoClient.create({
  wardrobeId: "wd_01HZZ8ABCDEF1234567890",
  name: "My Wardrobe",
  createdAt: 1735600000000,
});
const getResult = await repoClient.get({ wardrobeId: "wd_01HZZ8ABCDEF1234567890" });

const checks = [
  {
    name: "wardrobe meta key uses W#<wardrobeId> and META",
    ok: builtKey.PK === "W#wd_01HZZ8ABCDEF1234567890" && builtKey.SK === "META",
    detail: builtKey,
  },
  {
    name: "wardrobe meta item stores wardrobeId, name, createdAt with meta key",
    ok:
      builtItem.PK === builtKey.PK &&
      builtItem.SK === "META" &&
      builtItem.wardrobeId === "wd_01HZZ8ABCDEF1234567890" &&
      builtItem.name === "My Wardrobe" &&
      builtItem.createdAt === 1735600000000,
    detail: builtItem,
  },
  {
    name: "repo create builds PutItem for META with duplicate guard",
    ok:
      createResult.operation === "PutItem" &&
      createResult.request.input.TableName === "SpecTable" &&
      createResult.request.input.Item.PK === "W#wd_01HZZ8ABCDEF1234567890" &&
      createResult.request.input.Item.SK === "META" &&
      createResult.request.input.ConditionExpression === "attribute_not_exists(PK)",
    detail: createResult,
  },
  {
    name: "repo get builds consistent GetItem for META",
    ok:
      getResult.operation === "GetItem" &&
      getResult.request.input.TableName === "SpecTable" &&
      getResult.request.input.Key.PK === "W#wd_01HZZ8ABCDEF1234567890" &&
      getResult.request.input.Key.SK === "META" &&
      getResult.request.input.ConsistentRead === true,
    detail: getResult,
  },
  {
    name: "source exports required wardrobe repo builders",
    ok:
      source.includes("export function buildWardrobeMetaKey") &&
      source.includes("export function buildWardrobeMetaItem") &&
      source.includes("export function createWardrobeRepo"),
  },
  {
    name: "package script and CI include wardrobe repo spec test",
    ok:
      packageJson.includes('"test:wardrobe-repo": "node --import tsx/esm scripts/check-wardrobe-repo-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:wardrobe-repo"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS1-T01 wardrobe repo spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS1-T01 wardrobe repo spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
