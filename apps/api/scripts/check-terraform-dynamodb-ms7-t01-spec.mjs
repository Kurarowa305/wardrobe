import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const dynamodbTfPath = path.join(root, "../../infra/terraform/app/dynamodb.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const dynamodbTf = readFileSync(dynamodbTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const gsiCount = (dynamodbTf.match(/global_secondary_index\s*\{/g) ?? []).length;

const hasGsi = (name, hashKey, rangeKey) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedHashKey = hashKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRangeKey = rangeKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `global_secondary_index\\s*\\{[\\s\\S]*?name\\s*=\\s*"${escapedName}"[\\s\\S]*?hash_key\\s*=\\s*"${escapedHashKey}"[\\s\\S]*?range_key\\s*=\\s*"${escapedRangeKey}"[\\s\\S]*?projection_type\\s*=\\s*"ALL"[\\s\\S]*?\\}`,
    "m",
  );
  return pattern.test(dynamodbTf);
};

const checks = [
  {
    name: "WardrobeTable が PK/SK 複合キーを定義している",
    ok:
      dynamodbTf.includes('resource "aws_dynamodb_table" "wardrobe"') &&
      dynamodbTf.includes('hash_key     = "PK"') &&
      dynamodbTf.includes('range_key    = "SK"'),
  },
  {
    name: "課題要件の4つのGSIが定義されている",
    ok:
      hasGsi("StatusListByCreatedAt", "statusListPk", "createdSk") &&
      hasGsi("StatusListByWearCount", "statusListPk", "wearSk") &&
      hasGsi("StatusListByLastWornAt", "statusListPk", "lastWornSk") &&
      hasGsi("HistoryByDate", "PK", "historyDateSk") &&
      gsiCount === 4,
    detail: { gsiCount },
  },
  {
    name: "on-demand (PAY_PER_REQUEST) が有効",
    ok: dynamodbTf.includes('billing_mode = "PAY_PER_REQUEST"'),
  },
  {
    name: "PITR が有効",
    ok:
      dynamodbTf.includes("point_in_time_recovery {") &&
      dynamodbTf.includes("enabled = true"),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-dynamodb-ms7-t01": "node scripts/check-terraform-dynamodb-ms7-t01-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-dynamodb-ms7-t01") &&
      ciSource.includes("pnpm --filter api test:terraform-dynamodb-ms7-t01"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T01 dynamodb terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS7-T01 dynamodb terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
