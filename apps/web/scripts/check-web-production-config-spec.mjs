import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const failures = [];
let checkCount = 0;

function absFromWeb(relPath) {
  return path.join(webRoot, relPath);
}

function absFromRepo(relPath) {
  return path.join(repoRoot, relPath);
}

function readFromWeb(relPath) {
  return fs.readFileSync(absFromWeb(relPath), "utf8");
}

function readFromRepo(relPath) {
  return fs.readFileSync(absFromRepo(relPath), "utf8");
}

function includesFromWeb(relPath, expected) {
  return readFromWeb(relPath).includes(expected);
}

function includesFromRepo(relPath, expected) {
  return readFromRepo(relPath).includes(expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "WP-01",
  "API base URL は production build で必須化される",
  includesFromWeb("src/api/client.ts", "function resolveDefaultApiBaseUrl(): string {") &&
    includesFromWeb("src/api/client.ts", "process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? \"\"") &&
    includesFromWeb("src/api/client.ts", "if (process.env.NODE_ENV === \"production\") {") &&
    includesFromWeb("src/api/client.ts", "NEXT_PUBLIC_API_BASE_URL is required in production builds."),
  "src/api/client.ts に production 用 API base URL ガードが不足しています",
);

check(
  "WP-02",
  "画像配信 base URL は production build で必須化される",
  includesFromWeb(
    "src/features/clothing/imageUrl.ts",
    "process.env.NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL?.trim() ?? \"\"",
  ) &&
    includesFromWeb(
      "src/features/clothing/imageUrl.ts",
      "NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL is required in production builds.",
    ) &&
    includesFromWeb("src/features/clothing/imageUrl.ts", "if (process.env.NODE_ENV === \"production\") {"),
  "src/features/clothing/imageUrl.ts に production 用画像URLガードが不足しています",
);

check(
  "WP-03",
  "MSW 起動条件は production で無効化され、NEXT_PUBLIC_ENABLE_MSW を参照する",
  includesFromWeb("src/mocks/start.ts", "process.env.NEXT_PUBLIC_ENABLE_MSW?.trim().toLowerCase()") &&
    includesFromWeb("src/mocks/start.ts", "if (process.env.NODE_ENV === \"production\") {") &&
    includesFromWeb("src/mocks/start.ts", "if (enableMock === \"false\") {"),
  "src/mocks/start.ts の production 無効化またはフラグ判定が不足しています",
);

check(
  "WP-04",
  "Terraform apply job が API endpoint / images CDN domain を output として公開する",
  includesFromRepo(".github/workflows/terraform.yml", "api_endpoint: ${{ steps.tf-outputs.outputs.api_endpoint }}") &&
    includesFromRepo(
      ".github/workflows/terraform.yml",
      "images_cdn_domain: ${{ steps.tf-outputs.outputs.images_cdn_domain }}",
    ) &&
    includesFromRepo(".github/workflows/terraform.yml", "echo \"api_endpoint=$(terraform output -raw api_endpoint)\" >> \"$GITHUB_OUTPUT\"") &&
    includesFromRepo(
      ".github/workflows/terraform.yml",
      "echo \"images_cdn_domain=$(terraform output -raw images_cdn_domain)\" >> \"$GITHUB_OUTPUT\"",
    ),
  "terraform workflow に API / images の output 連携が不足しています",
);

check(
  "WP-05",
  "Terraform deploy_web job の web build が AWS向け公開環境変数を注入し MSW を無効化する",
  includesFromRepo(".github/workflows/terraform.yml", "NEXT_PUBLIC_API_BASE_URL: ${{ needs.apply.outputs.api_endpoint }}") &&
    includesFromRepo(
      ".github/workflows/terraform.yml",
      "NEXT_PUBLIC_IMAGE_PUBLIC_BASE_URL: https://${{ needs.apply.outputs.images_cdn_domain }}",
    ) &&
    includesFromRepo(".github/workflows/terraform.yml", 'NEXT_PUBLIC_ENABLE_MSW: "false"') &&
    includesFromRepo(".github/workflows/terraform.yml", "run: pnpm --filter web build"),
  "terraform deploy_web の web build 環境変数設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
