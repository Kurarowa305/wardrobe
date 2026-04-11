import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const historyUsecasePath = path.join(root, "src/domains/history/usecases/createHistoryWithStatsWrite.ts");
const iamTfPath = path.join(root, "../../infra/terraform/app/iam.tf");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const historyUsecaseSource = readFileSync(historyUsecasePath, "utf8");
const iamTf = readFileSync(iamTfPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const conditionCheckActionCount = (iamTf.match(/"dynamodb:ConditionCheckItem"/g) ?? []).length;

const checks = [
  {
    name: "履歴作成ユースケースが参照先存在確認の ConditionCheck を TransactWrite に含める",
    ok:
      historyUsecaseSource.includes("const buildReferenceConditionChecks") &&
      historyUsecaseSource.includes("ConditionCheck: {") &&
      historyUsecaseSource.includes('ConditionExpression: "attribute_exists(PK)"') &&
      historyUsecaseSource.includes("...buildReferenceConditionChecks({"),
  },
  {
    name: "DynamoDB 更新系 IAM 権限に ConditionCheckItem が含まれる",
    ok:
      iamTf.includes('lambda_dynamodb_domains             = toset(["wardrobe", "clothing", "template", "history"])') &&
      conditionCheckActionCount >= 2,
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:history-iam-condition-check": "node scripts/check-history-iam-condition-check-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-iam-condition-check") &&
      ciSource.includes("pnpm --filter api test:history-iam-condition-check"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history iam condition check spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("history iam condition check spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
