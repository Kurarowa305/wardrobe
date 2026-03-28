import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const s3ImagesTfPath = path.join(root, "../../infra/terraform/app/s3_images.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const s3ImagesTf = readFileSync(s3ImagesTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "images バケットが作成される",
    ok:
      s3ImagesTf.includes('resource "aws_s3_bucket" "images"') &&
      s3ImagesTf.includes("bucket = local.images_bucket_name"),
  },
  {
    name: "CORS で PUT/GET/HEAD が許可される",
    ok:
      s3ImagesTf.includes('resource "aws_s3_bucket_cors_configuration" "images"') &&
      s3ImagesTf.includes('allowed_methods = ["GET", "PUT", "HEAD"]'),
  },
  {
    name: "public access block が有効で private bucket を維持する",
    ok:
      s3ImagesTf.includes('resource "aws_s3_bucket_public_access_block" "images"') &&
      s3ImagesTf.includes("block_public_acls       = true") &&
      s3ImagesTf.includes("block_public_policy     = true") &&
      s3ImagesTf.includes("ignore_public_acls      = true") &&
      s3ImagesTf.includes("restrict_public_buckets = true"),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-s3-images-ms7-t02": "node scripts/check-terraform-s3-images-ms7-t02-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-s3-images-ms7-t02") &&
      ciSource.includes("pnpm --filter api test:terraform-s3-images-ms7-t02"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T02 s3 images terraform spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T02 s3 images terraform spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
