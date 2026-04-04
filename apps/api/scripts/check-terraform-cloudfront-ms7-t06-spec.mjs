import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const cloudfrontWebTfPath = path.join(root, "../../infra/terraform/app/cloudfront_web.tf");
const cloudfrontImagesTfPath = path.join(root, "../../infra/terraform/app/cloudfront_images.tf");
const s3WebTfPath = path.join(root, "../../infra/terraform/app/s3_web.tf");
const s3ImagesTfPath = path.join(root, "../../infra/terraform/app/s3_images.tf");
const outputsTfPath = path.join(root, "../../infra/terraform/app/outputs.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const cloudfrontWebTf = readFileSync(cloudfrontWebTfPath, "utf8");
const cloudfrontImagesTf = readFileSync(cloudfrontImagesTfPath, "utf8");
const s3WebTf = readFileSync(s3WebTfPath, "utf8");
const s3ImagesTf = readFileSync(s3ImagesTfPath, "utf8");
const outputsTf = readFileSync(outputsTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "web 配信用 S3 バケットが作成され、公開ブロックが有効化される",
    ok:
      s3WebTf.includes('resource "aws_s3_bucket" "web"') &&
      s3WebTf.includes('resource "aws_s3_bucket_public_access_block" "web"') &&
      s3WebTf.includes("block_public_acls       = true") &&
      s3WebTf.includes("block_public_policy     = true") &&
      s3WebTf.includes("ignore_public_acls      = true") &&
      s3WebTf.includes("restrict_public_buckets = true"),
  },
  {
    name: "web 配信用 CloudFront distribution と OAC が定義される",
    ok:
      cloudfrontWebTf.includes('resource "aws_cloudfront_origin_access_control" "web"') &&
      cloudfrontWebTf.includes('resource "aws_cloudfront_distribution" "web"') &&
      cloudfrontWebTf.includes("origin_access_control_id = aws_cloudfront_origin_access_control.web.id") &&
      cloudfrontWebTf.includes('default_root_object = "index.html"'),
  },
  {
    name: "web 配信で拡張子なしURLを .html へ rewrite する CloudFront Function が定義される",
    ok:
      cloudfrontWebTf.includes('resource "aws_cloudfront_function" "web_rewrite_html"') &&
      cloudfrontWebTf.includes('runtime = "cloudfront-js-1.0"') &&
      cloudfrontWebTf.includes('function_association {') &&
      cloudfrontWebTf.includes('event_type   = "viewer-request"') &&
      cloudfrontWebTf.includes("function_arn = aws_cloudfront_function.web_rewrite_html.arn"),
  },
  {
    name: "web 配信で 403/404 を 404.html へフォールバックする",
    ok:
      cloudfrontWebTf.includes("custom_error_response {") &&
      cloudfrontWebTf.includes("error_code            = 403") &&
      cloudfrontWebTf.includes("error_code            = 404") &&
      cloudfrontWebTf.includes('response_page_path    = "/404.html"') &&
      cloudfrontWebTf.includes("response_code         = 404"),
  },
  {
    name: "images 配信用 CloudFront distribution と OAC が定義される",
    ok:
      cloudfrontImagesTf.includes('resource "aws_cloudfront_origin_access_control" "images"') &&
      cloudfrontImagesTf.includes('resource "aws_cloudfront_distribution" "images"') &&
      cloudfrontImagesTf.includes("origin_access_control_id = aws_cloudfront_origin_access_control.images.id") &&
      cloudfrontImagesTf.includes('target_origin_id = aws_s3_bucket.images.id'),
  },
  {
    name: "OAC 経由読み取りのため CloudFront を principal とした S3 バケットポリシーが設定される",
    ok:
      cloudfrontWebTf.includes('resource "aws_s3_bucket_policy" "web"') &&
      cloudfrontWebTf.includes('identifiers = ["cloudfront.amazonaws.com"]') &&
      cloudfrontWebTf.includes('variable = "AWS:SourceArn"') &&
      cloudfrontImagesTf.includes('resource "aws_s3_bucket_policy" "images"') &&
      cloudfrontImagesTf.includes('identifiers = ["cloudfront.amazonaws.com"]') &&
      cloudfrontImagesTf.includes('variable = "AWS:SourceArn"'),
  },
  {
    name: "web/images CDN の出力値が outputs.tf に定義される",
    ok:
      outputsTf.includes('output "web_cdn_domain"') &&
      outputsTf.includes('output "web_cdn_distribution_id"') &&
      outputsTf.includes('output "images_cdn_domain"') &&
      outputsTf.includes('output "images_cdn_distribution_id"'),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-cloudfront-ms7-t06": "node scripts/check-terraform-cloudfront-ms7-t06-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-cloudfront-ms7-t06") &&
      ciSource.includes("pnpm --filter api test:terraform-cloudfront-ms7-t06"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T06 cloudfront terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T06 cloudfront terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
