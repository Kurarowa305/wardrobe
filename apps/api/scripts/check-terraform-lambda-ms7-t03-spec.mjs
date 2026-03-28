import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const lambdaTfPath = path.join(root, "../../infra/terraform/app/lambda.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const lambdaTf = readFileSync(lambdaTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const domains = ["wardrobe", "clothing", "template", "history", "presign"];

const checks = [
  {
    name: "domain Lambda 用の for_each リソースが定義されている",
    ok:
      lambdaTf.includes('resource "aws_lambda_function" "domain"') &&
      lambdaTf.includes("for_each = local.lambda_domains"),
  },
  {
    name: "対象5ドメインが lambda_domains に含まれる",
    ok: domains.every((domain) => lambdaTf.includes(`"${domain}"`)),
  },
  {
    name: "命名規則 {app}-{env}-{domain}_server が定義されている",
    ok: lambdaTf.includes('domain => "${var.lambda_app_name}-${var.env}-${domain}_server"'),
  },
  {
    name: "各ドメインが専用 handler に紐づいている",
    ok:
      lambdaTf.includes('wardrobe = "entry/lambda/wardrobe_server.handler"') &&
      lambdaTf.includes('clothing = "entry/lambda/clothing_server.handler"') &&
      lambdaTf.includes('template = "entry/lambda/template_server.handler"') &&
      lambdaTf.includes('history  = "entry/lambda/history_server.handler"') &&
      lambdaTf.includes('presign  = "entry/lambda/presign_server.handler"'),
  },
  {
    name: "CloudWatch Log Group がドメインLambdaごとに作成される",
    ok: lambdaTf.includes('resource "aws_cloudwatch_log_group" "lambda_domain"'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-lambda-ms7-t03": "node scripts/check-terraform-lambda-ms7-t03-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-lambda-ms7-t03") &&
      ciSource.includes("pnpm --filter api test:terraform-lambda-ms7-t03"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T03 lambda terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T03 lambda terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
