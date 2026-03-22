import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
}

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

function excludes(relPath, expected) {
  return !read(relPath).includes(expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}
  ${detail}`);
}

const dialogTarget = "src/components/app/dialogs/ConfirmDialog.tsx";
const clothingTarget = "src/components/app/screens/ClothingDetailScreen.tsx";
const templateTarget = "src/components/app/screens/TemplateDetailScreen.tsx";
const historyTarget = "src/components/app/screens/HistoryDetailScreen.tsx";

check(
  "CDD-01",
  "削除確認用の自前ダイアログコンポーネントが存在する",
  includes(dialogTarget, "export function ConfirmDialog") &&
    includes(dialogTarget, 'role="alertdialog"') &&
    includes(dialogTarget, "confirmLabel") &&
    includes(dialogTarget, "cancelLabel"),
  "ConfirmDialog.tsx の実装が不足しています",
);

for (const [id, target] of [["CDD-02", clothingTarget], ["CDD-03", templateTarget], ["CDD-04", historyTarget]]) {
  check(
    id,
    `${target} が ConfirmDialog を利用し window.confirm を使わない`,
    includes(target, "<ConfirmDialog") &&
      includes(target, "COMMON_STRINGS.dialogs.confirmDelete.title") &&
      includes(target, "COMMON_STRINGS.dialogs.confirmDelete.message") &&
      excludes(target, "window.confirm("),
    `${target} の削除確認ダイアログ差し替えが不足しています`,
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
