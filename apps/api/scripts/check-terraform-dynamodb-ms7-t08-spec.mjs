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
    name: "StatusGenreListByCreatedAt GSI が追加されている",
    ok: hasGsi("StatusGenreListByCreatedAt", "statusGenreListPk", "createdAtSk"),
  },
  {
    name: "status+genre GSI 用 attribute が定義されている",
    ok:
      dynamodbTf.includes('name = "statusGenreListPk"') &&
      dynamodbTf.includes('name = "createdAtSk"'),
  },
  {
    name: "既存4 GSI が維持されている",
    ok:
      hasGsi("StatusListByCreatedAt", "statusListPk", "createdSk") &&
      hasGsi("StatusListByWearCount", "statusListPk", "wearSk") &&
      hasGsi("StatusListByLastWornAt", "statusListPk", "lastWornSk") &&
      hasGsi("HistoryByDate", "PK", "historyDateSk"),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-dynamodb-ms7-t08": "node scripts/check-terraform-dynamodb-ms7-t08-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-dynamodb-ms7-t08") &&
      ciSource.includes("pnpm --filter api test:terraform-dynamodb-ms7-t08"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T08 dynamodb status+genre GSI spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T08 dynamodb status+genre GSI spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
