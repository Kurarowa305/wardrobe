import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const apigwTfPath = path.join(root, "../../infra/terraform/app/apigw_http_api.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const apigwTf = readFileSync(apigwTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "HTTP API が定義されている",
    ok: apigwTf.includes('resource "aws_apigatewayv2_api" "http_api"'),
  },
  {
    name: "ドメインごとの integration マップが定義されている",
    ok:
      apigwTf.includes("apigw_domain_integrations") &&
      apigwTf.includes('wardrobe = aws_lambda_function.domain["wardrobe"].invoke_arn') &&
      apigwTf.includes('clothing = aws_lambda_function.domain["clothing"].invoke_arn') &&
      apigwTf.includes('template = aws_lambda_function.domain["template"].invoke_arn') &&
      apigwTf.includes('history  = aws_lambda_function.domain["history"].invoke_arn') &&
      apigwTf.includes('presign  = aws_lambda_function.domain["presign"].invoke_arn'),
  },
  {
    name: "path prefix ごとの route が定義され、wardrobe/clothing/template/history の detail 系は ID パラメータで定義されている",
    ok:
      apigwTf.includes('"ANY /wardrobes"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/clothing"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/clothing/{clothingId}"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/templates"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/templates/{templateId}"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/histories"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/histories/{historyId}"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/images/presign"') &&
      apigwTf.includes('"ANY /wardrobes/{wardrobeId}/images/presign/{proxy+}"'),
  },
  {
    name: "wardrobe/clothing/template/history の detail route に {proxy+} が残っていない",
    ok:
      !apigwTf.includes('"ANY /wardrobes/{proxy+}"') &&
      !apigwTf.includes('"ANY /wardrobes/{wardrobeId}/clothing/{proxy+}"') &&
      !apigwTf.includes('"ANY /wardrobes/{wardrobeId}/templates/{proxy+}"') &&
      !apigwTf.includes('"ANY /wardrobes/{wardrobeId}/histories/{proxy+}"'),
  },
  {
    name: "旧 clothings path prefix が残っていない",
    ok:
      !apigwTf.includes('"ANY /wardrobes/{wardrobeId}/clothings"') &&
      !apigwTf.includes('"ANY /wardrobes/{wardrobeId}/clothings/{proxy+}"'),
  },
  {
    name: "route -> integration が動的に紐づいている",
    ok:
      apigwTf.includes('resource "aws_apigatewayv2_route" "domain"') &&
      apigwTf.includes('target    = "integrations/${aws_apigatewayv2_integration.domain[each.value].id}"'),
  },
  {
    name: "ドメイン Lambda ごとに invoke permission が付与される",
    ok:
      apigwTf.includes('resource "aws_lambda_permission" "apigw_domain"') &&
      apigwTf.includes("for_each = local.lambda_domains") &&
      apigwTf.includes('function_name = aws_lambda_function.domain[each.key].function_name'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-apigw-ms7-t04": "node scripts/check-terraform-apigw-ms7-t04-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-apigw-ms7-t04") &&
      ciSource.includes("pnpm --filter api test:terraform-apigw-ms7-t04"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T04 apigw terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T04 apigw terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
