import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const dynamodb = await import(path.join(root, "src/clients/dynamodb.ts"));
const source = readFileSync(path.join(root, "src/clients/dynamodb.ts"), "utf8");
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const defaultConfig = dynamodb.createDynamoDbClientConfig();
const localClient = dynamodb.createDynamoDbClient({
  endpoint: "http://localhost:8000",
  tableName: "SpecTable",
});
const cloudClient = dynamodb.createDynamoDbClient({
  region: "us-east-1",
  tableName: "ProdTable",
});

const sampleGet = await localClient.getItem({
  Key: { PK: "W#wardrobe", SK: "META" },
});
const sampleBatchGet = await localClient.batchGetItem({
  Keys: [{ PK: "W#wardrobe#CLOTH", SK: "CLOTH#1" }],
});
const sampleTransactWrite = await localClient.transactWriteItems({
  TransactItems: [
    {
      Put: {
        Item: { PK: "W#wardrobe", SK: "META", name: "main" },
      },
    },
  ],
});

const checks = [
  {
    name: "default config exposes region and table name defaults",
    ok: defaultConfig.region === "ap-northeast-1" && defaultConfig.tableName === "WardrobeTable",
    detail: defaultConfig,
  },
  {
    name: "local endpoint switches transport endpoint and static local credentials",
    ok:
      localClient.config.endpoint === "http://localhost:8000" &&
      localClient.documentClient.config.endpoint === "http://localhost:8000" &&
      localClient.documentClient.config.accessMode === "local" &&
      localClient.documentClient.config.credentials?.accessKeyId === "local",
    detail: localClient.documentClient.config,
  },
  {
    name: "cloud config keeps aws region and does not force local credentials",
    ok:
      cloudClient.config.region === "us-east-1" &&
      cloudClient.config.endpoint === undefined &&
      cloudClient.documentClient.config.region === "us-east-1" &&
      cloudClient.documentClient.config.accessMode === "aws" &&
      cloudClient.documentClient.config.credentials === undefined,
    detail: cloudClient.documentClient.config,
  },
  {
    name: "client exposes required DynamoDB operations",
    ok: ["getItem", "putItem", "updateItem", "query", "batchGetItem", "transactWriteItems"].every(
      (key) => typeof localClient[key] === "function",
    ),
  },
  {
    name: "required operations are built with operation payloads and table name injection",
    ok:
      sampleGet.operation === "GetItem" &&
      sampleGet.request.input.TableName === "SpecTable" &&
      sampleBatchGet.operation === "BatchGetItem" &&
      Array.isArray(sampleBatchGet.request.input.RequestItems.SpecTable.Keys) &&
      sampleTransactWrite.operation === "TransactWriteItems" &&
      sampleTransactWrite.request.input.TransactItems.length === 1,
    detail: {
      sampleGet,
      sampleBatchGet,
      sampleTransactWrite,
    },
  },
  {
    name: "source declares required DynamoDB operation names",
    ok: ["GetItem", "PutItem", "UpdateItem", "Query", "BatchGetItem", "TransactWriteItems"].every(
      (token) => source.includes(`\"${token}\"`),
    ),
  },
  {
    name: "package script and CI include dynamodb spec test",
    ok:
      packageJson.includes('"test:dynamodb": "node --import tsx/esm scripts/check-dynamodb-client-spec.mjs"') &&
      ciSource.includes("pnpm --filter api test:dynamodb"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS0-T04 dynamodb client spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS0-T04 dynamodb client spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
