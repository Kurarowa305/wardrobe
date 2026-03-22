import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
}

function includes(relPath, snippet) {
  return read(relPath).includes(snippet);
}

const failures = [];
let checkCount = 0;

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }

  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "OTS-01",
  "操作結果トースト用の query helper が定義されている",
  includes("src/features/toast/operationToast.ts", 'export const OPERATION_TOAST_QUERY_KEY = "toast";') &&
    includes("src/features/toast/operationToast.ts", "appendOperationToast") &&
    includes("src/features/toast/operationToast.ts", "consumeOperationToast"),
  "operationToast helper の定義が不足しています",
);

check(
  "OTS-02",
  "服の追加・編集・削除で toast query を付けて遷移する",
  includes("src/components/app/screens/ClothingCreateScreen.tsx", "OPERATION_TOAST_IDS.clothingCreated") &&
    includes("src/components/app/screens/ClothingEditScreen.tsx", "OPERATION_TOAST_IDS.clothingUpdated") &&
    includes("src/components/app/screens/ClothingDetailScreen.tsx", "OPERATION_TOAST_IDS.clothingDeleted"),
  "服の操作後遷移に toast query 付与が不足しています",
);

check(
  "OTS-03",
  "服一覧・詳細画面が追加/編集/削除成功トーストを表示して query を消費する",
  includes("src/components/app/screens/ClothingsTabScreen.tsx", "consumeOperationToast(window.location.search)") &&
    includes("src/components/app/screens/ClothingsTabScreen.tsx", "CLOTHING_STRINGS.create.messages.submitSuccess") &&
    includes("src/components/app/screens/ClothingsTabScreen.tsx", "CLOTHING_STRINGS.detail.messages.deleteSuccess") &&
    includes("src/components/app/screens/ClothingDetailScreen.tsx", "CLOTHING_STRINGS.edit.messages.submitSuccess") &&
    includes("src/components/app/screens/ClothingDetailScreen.tsx", "window.history.replaceState"),
  "服画面での成功トースト表示または query 消費処理が不足しています",
);

check(
  "OTS-04",
  "テンプレートの追加・編集・削除で toast query を付けて遷移し、一覧・詳細で成功トーストを表示する",
  includes("src/components/app/screens/TemplateForm.tsx", "OPERATION_TOAST_IDS.templateCreated") &&
    includes("src/components/app/screens/TemplateForm.tsx", "OPERATION_TOAST_IDS.templateUpdated") &&
    includes("src/components/app/screens/TemplateDetailScreen.tsx", "OPERATION_TOAST_IDS.templateDeleted") &&
    includes("src/components/app/screens/TemplatesTabScreen.tsx", "TEMPLATE_STRINGS.create.messages.submitSuccess") &&
    includes("src/components/app/screens/TemplatesTabScreen.tsx", "TEMPLATE_STRINGS.detail.messages.deleteSuccess") &&
    includes("src/components/app/screens/TemplateDetailScreen.tsx", "TEMPLATE_STRINGS.edit.messages.submitSuccess"),
  "テンプレート画面での成功トースト導線が不足しています",
);

check(
  "OTS-05",
  "履歴の追加・削除で toast query を付けて遷移し、ホーム/履歴一覧で成功トーストを表示する",
  includes("src/components/app/screens/RecordByTemplateScreen.tsx", "OPERATION_TOAST_IDS.historyCreated") &&
    includes("src/components/app/screens/RecordByCombinationScreen.tsx", "OPERATION_TOAST_IDS.historyCreated") &&
    includes("src/components/app/screens/HistoryDetailScreen.tsx", "OPERATION_TOAST_IDS.historyDeleted") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "HOME_STRINGS.toasts.historyCreated") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "HOME_STRINGS.toasts.historyDeleted") &&
    includes("src/components/app/screens/HistoriesTabScreen.tsx", "HISTORY_STRINGS.detail.messages.deleteSuccess"),
  "履歴画面での成功トースト導線が不足しています",
);

check(
  "OTS-06",
  "ワードローブ作成も共通 toast query helper を利用する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "OPERATION_TOAST_IDS.wardrobeCreated") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "OPERATION_TOAST_IDS.wardrobeCreated"),
  "ワードローブ作成のトースト導線が共通化されていません",
);

check(
  "OTS-07",
  "成功トースト文言が各 feature strings に定義されている",
  includes("src/features/clothing/strings.ts", 'submitSuccess: "服を追加しました。"') &&
    includes("src/features/clothing/strings.ts", 'deleteSuccess: "服を削除しました。"') &&
    includes("src/features/template/strings.ts", 'submitSuccess: "テンプレートを追加しました。"') &&
    includes("src/features/template/strings.ts", 'deleteSuccess: "テンプレートを削除しました。"') &&
    includes("src/features/history/strings.ts", 'deleteSuccess: "履歴を削除しました。"') &&
    includes("src/features/record/strings.ts", 'submitSuccess: "記録を追加しました。"'),
  "成功トースト文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
