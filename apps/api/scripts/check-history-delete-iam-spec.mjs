import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const iamTfPath = path.join(root, "../../infra/terraform/app/iam.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const testDesignPath = path.join(
  root,
  "../../design/テスト設計/履歴削除500修正_history_IAM_DeleteItem権限テスト設計.md",
);

const iamTf = readFileSync(iamTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const testDesignSource = readFileSync(testDesignPath, "utf8");

const deleteActionListMatches = iamTf.match(
  /"dynamodb:GetItem",\s*"dynamodb:PutItem",\s*"dynamodb:UpdateItem",\s*"dynamodb:DeleteItem",\s*"dynamodb:Query"/g,
) ?? [];

const checks = [
  {
    name: "history ドメインが DynamoDB 書き込み対象に含まれる",
    ok:
      iamTf.includes('lambda_dynamodb_domains             = toset(["wardrobe", "clothing", "template", "history"])'),
  },
  {
    name: "共通 Lambda policy が DynamoDB DeleteItem 権限を持つ",
    ok:
      iamTf.includes('data "aws_iam_policy_document" "lambda_policy"') &&
      deleteActionListMatches.length >= 2,
  },
  {
    name: "ドメイン Lambda policy が DynamoDB DeleteItem 権限を持つ",
    ok:
      iamTf.includes('data "aws_iam_policy_document" "lambda_domain_policy"') &&
      iamTf.includes('for_each = contains(local.lambda_dynamodb_domains, each.key) ? [1] : []') &&
      deleteActionListMatches.length >= 2,
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes('"test:history-delete-iam": "node scripts/check-history-delete-iam-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-delete-iam") &&
      ciSource.includes("pnpm --filter api test:history-delete-iam"),
  },
  {
    name: "テスト設計書が新規 spec test を参照している",
    ok:
      testDesignSource.includes("check-history-delete-iam-spec.mjs") &&
      testDesignSource.includes("pnpm --filter api test:history-delete-iam"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history delete iam spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("history delete iam spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
