import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const iamTfPath = path.join(root, "../../infra/terraform/app/iam.tf");
const lambdaTfPath = path.join(root, "../../infra/terraform/app/lambda.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const iamTf = readFileSync(iamTfPath, "utf8");
const lambdaTf = readFileSync(lambdaTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "ドメイン Lambda 用 IAM ロールが for_each で作成される",
    ok:
      iamTf.includes('resource "aws_iam_role" "lambda_domain"') &&
      iamTf.includes("for_each = local.lambda_domains"),
  },
  {
    name: "ドメイン Lambda がドメイン専用ロールを参照する",
    ok: lambdaTf.includes('role          = aws_iam_role.lambda_domain[each.key].arn'),
  },
  {
    name: "全ドメイン共通で CloudWatch Logs 権限が付与される",
    ok:
      iamTf.includes('data "aws_iam_policy_document" "lambda_domain_policy"') &&
      iamTf.includes('"logs:CreateLogGroup"') &&
      iamTf.includes('"logs:CreateLogStream"') &&
      iamTf.includes('"logs:PutLogEvents"'),
  },
  {
    name: "presign のみ S3 権限、その他ドメインは DynamoDB 権限が付与される",
    ok:
      iamTf.includes('lambda_dynamodb_domains = toset(["wardrobe", "clothing", "template", "history"])') &&
      iamTf.includes('lambda_s3_domains       = toset(["presign"])') &&
      iamTf.includes('for_each = contains(local.lambda_dynamodb_domains, each.key) ? [1] : []') &&
      iamTf.includes('for_each = contains(local.lambda_s3_domains, each.key) ? [1] : []'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-iam-ms7-t05": "node scripts/check-terraform-iam-ms7-t05-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-iam-ms7-t05") &&
      ciSource.includes("pnpm --filter api test:terraform-iam-ms7-t05"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T05 iam terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T05 iam terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
