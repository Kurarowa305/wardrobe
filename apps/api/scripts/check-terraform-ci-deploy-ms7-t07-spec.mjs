import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const terraformWorkflowPath = path.join(root, "../../.github/workflows/terraform.yml");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const terraformWorkflow = readFileSync(terraformWorkflowPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const checks = [
  {
    name: "Terraform workflow は master への push のみで実行される",
    ok:
      terraformWorkflow.includes("on:\n  push:\n    branches:\n      - master") &&
      !terraformWorkflow.includes("pull_request:") &&
      !terraformWorkflow.includes("workflow_dispatch:"),
  },
  {
    name: "plan job が terraform plan を実行する",
    ok:
      terraformWorkflow.includes("jobs:\n  plan:") &&
      terraformWorkflow.includes("- name: Terraform plan") &&
      terraformWorkflow.includes("terraform plan -var-file=../env/dev.tfvars"),
  },
  {
    name: "apply job が plan 後に terraform apply を実行する",
    ok:
      terraformWorkflow.includes("  apply:\n") &&
      terraformWorkflow.includes("needs: plan") &&
      terraformWorkflow.includes("- name: Terraform apply") &&
      terraformWorkflow.includes("terraform apply -auto-approve -var-file=../env/dev.tfvars"),
  },
  {
    name: "apply job に concurrency が設定される",
    ok:
      terraformWorkflow.includes("concurrency:") &&
      terraformWorkflow.includes("group: wardrobe-dev-terraform") &&
      terraformWorkflow.includes("cancel-in-progress: false"),
  },
  {
    name: "テストスクリプトが package.json と CI に登録されている",
    ok:
      packageJson.includes(
        '"test:terraform-ci-deploy-ms7-t07": "node scripts/check-terraform-ci-deploy-ms7-t07-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:terraform-ci-deploy-ms7-t07") &&
      ciSource.includes("pnpm --filter api test:terraform-ci-deploy-ms7-t07"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS7-T07 terraform ci deploy spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log("BE-MS7-T07 terraform ci deploy spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
