import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const cloudfrontWebTfPath = path.join(root, "../../infra/terraform/app/cloudfront_web.tf");
const s3WebTfPath = path.join(root, "../../infra/terraform/app/s3_web.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const cloudfrontWebTf = readFileSync(cloudfrontWebTfPath, "utf8");
const s3WebTf = readFileSync(s3WebTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const has403Fallback = /custom_error_response\s*{[\s\S]*?error_code\s*=\s*403[\s\S]*?response_code\s*=\s*200[\s\S]*?response_page_path\s*=\s*"\/index\.html"[\s\S]*?}/.test(
  cloudfrontWebTf,
);
const has404Fallback = /custom_error_response\s*{[\s\S]*?error_code\s*=\s*404[\s\S]*?response_code\s*=\s*200[\s\S]*?response_page_path\s*=\s*"\/index\.html"[\s\S]*?}/.test(
  cloudfrontWebTf,
);

const checks = [
  {
    name: "web 配信用 S3 バケットは private で public access block が有効化される",
    ok:
      s3WebTf.includes('resource "aws_s3_bucket" "web"') &&
      s3WebTf.includes('resource "aws_s3_bucket_public_access_block" "web"') &&
      s3WebTf.includes("block_public_acls       = true") &&
      s3WebTf.includes("block_public_policy     = true") &&
      s3WebTf.includes("ignore_public_acls      = true") &&
      s3WebTf.includes("restrict_public_buckets = true"),
  },
  {
    name: "CloudFront は S3 REST endpoint + OAC を origin とし HTTPS リダイレクトを有効化する",
    ok:
      cloudfrontWebTf.includes('resource "aws_cloudfront_origin_access_control" "web"') &&
      cloudfrontWebTf.includes("domain_name              = aws_s3_bucket.web.bucket_regional_domain_name") &&
      cloudfrontWebTf.includes("origin_access_control_id = aws_cloudfront_origin_access_control.web.id") &&
      cloudfrontWebTf.includes('viewer_protocol_policy = "redirect-to-https"'),
  },
  {
    name: "Default Root Object は index.html で、403/404 を index.html(200) にフォールバックする",
    ok: cloudfrontWebTf.includes('default_root_object = "index.html"') && has403Fallback && has404Fallback,
  },
  {
    name: "S3 バケットポリシーは CloudFront(OAC) 経由の GetObject のみ許可する",
    ok:
      cloudfrontWebTf.includes('resource "aws_s3_bucket_policy" "web"') &&
      cloudfrontWebTf.includes('identifiers = ["cloudfront.amazonaws.com"]') &&
      cloudfrontWebTf.includes("actions = [\"s3:GetObject\"]") &&
      cloudfrontWebTf.includes('variable = "AWS:SourceArn"') &&
      cloudfrontWebTf.includes("values   = [aws_cloudfront_distribution.web.arn]"),
  },
  {
    name: "テストスクリプトが package.json と CI に登録される",
    ok:
      packageJson.includes(
        '"test:terraform-spa-fallback-ms7-t08": "node scripts/check-terraform-spa-fallback-ms7-t08-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-spa-fallback-ms7-t08") &&
      ciSource.includes("pnpm --filter api test:terraform-spa-fallback-ms7-t08"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T08 terraform SPA fallback spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T08 terraform SPA fallback spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
