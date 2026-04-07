import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const iamTfPath = path.join(root, "../../infra/terraform/app/iam.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const iamTf = readFileSync(iamTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "presign ドメインを DynamoDB read-only 対象に含める",
    ok: iamTf.includes('lambda_dynamodb_read_only_domains   = toset(["presign"])'),
  },
  {
    name: "presign ドメインに DynamoDB GetItem 権限を付与する動的statementを持つ",
    ok:
      iamTf.includes('for_each = contains(local.lambda_dynamodb_read_only_domains, each.key) ? [1] : []') &&
      iamTf.includes('"dynamodb:GetItem"') &&
      iamTf.includes('resources = [') &&
      iamTf.includes('aws_dynamodb_table.wardrobe.arn'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes('"test:presign-iam-dynamodb-read": "node scripts/check-presign-iam-dynamodb-read-spec.mjs"') &&
      packageJson.includes("pnpm run test:presign-iam-dynamodb-read") &&
      ciSource.includes("pnpm --filter api test:presign-iam-dynamodb-read"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("presign iam dynamodb read spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("presign iam dynamodb read spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
