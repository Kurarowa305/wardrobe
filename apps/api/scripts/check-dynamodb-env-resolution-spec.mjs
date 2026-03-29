import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const dynamodb = await import(path.join(root, "src/clients/dynamodb.ts"));
const packageJson = readFileSync(path.join(root, "package.json"), "utf8");
const ciSource = readFileSync(path.join(root, "../../.github/workflows/ci.yml"), "utf8");

const trackedEnvKeys = ["AWS_REGION", "DDB_ENDPOINT", "TABLE_NAME"];
const previousEnv = Object.fromEntries(trackedEnvKeys.map((key) => [key, process.env[key]]));

const setEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
};

for (const key of trackedEnvKeys) {
  setEnv(key, undefined);
}

const defaultConfig = dynamodb.createDynamoDbClientConfig();

setEnv("AWS_REGION", "us-west-2");
setEnv("DDB_ENDPOINT", "http://127.0.0.1:8001");
setEnv("TABLE_NAME", "wardrobe-dev-WardrobeTable");

const envConfig = dynamodb.createDynamoDbClientConfig();
const overrideConfig = dynamodb.createDynamoDbClientConfig({
  region: "ap-southeast-2",
  endpoint: "http://localhost:9000",
  tableName: "override-table",
});

const mockDocumentClient = {
  send: async () => ({}),
};

const envClient = dynamodb.createDynamoDbClient({
  documentClient: mockDocumentClient,
});
const putResult = await envClient.putItem({
  Item: { PK: "W#wd_001", SK: "META", wardrobeId: "wd_001", name: "My Wardrobe", createdAt: 1735600000000 },
});

for (const key of trackedEnvKeys) {
  setEnv(key, previousEnv[key]);
}

const checks = [
  {
    name: "env 未設定時は既定値で DynamoDB 設定を解決する",
    ok:
      defaultConfig.region === "ap-northeast-1"
      && defaultConfig.endpoint === undefined
      && defaultConfig.tableName === "WardrobeTable",
    detail: defaultConfig,
  },
  {
    name: "環境変数 AWS_REGION/DDB_ENDPOINT/TABLE_NAME を DynamoDB 設定へ反映できる",
    ok:
      envConfig.region === "us-west-2"
      && envConfig.endpoint === "http://127.0.0.1:8001"
      && envConfig.tableName === "wardrobe-dev-WardrobeTable",
    detail: envConfig,
  },
  {
    name: "明示 override が環境変数より優先される",
    ok:
      overrideConfig.region === "ap-southeast-2"
      && overrideConfig.endpoint === "http://localhost:9000"
      && overrideConfig.tableName === "override-table",
    detail: overrideConfig,
  },
  {
    name: "環境変数で解決した TABLE_NAME が putItem リクエストへ適用される",
    ok:
      putResult.operation === "PutItem"
      && putResult.request.input.TableName === "wardrobe-dev-WardrobeTable",
    detail: putResult.request,
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes('"test:dynamodb-env-resolution": "node --import tsx/esm scripts/check-dynamodb-env-resolution-spec.mjs"')
      && packageJson.includes("pnpm run test:dynamodb-env-resolution")
      && ciSource.includes("pnpm --filter api test:dynamodb-env-resolution"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("wardrobe create 500 fix dynamodb env resolution spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("wardrobe create 500 fix dynamodb env resolution spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
