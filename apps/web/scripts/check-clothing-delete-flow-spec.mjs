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

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const screenTarget = "src/components/app/screens/ClothingDetailScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";
const menuTarget = "src/components/app/navigation/OverflowMenu.tsx";

check(
  "CDL-01",
  "服詳細画面で useDeleteClothingMutation を利用して削除処理を実行する",
  includes(screenTarget, 'import { useClothing, useDeleteClothingMutation } from "@/api/hooks/clothing";') &&
    includes(screenTarget, "const deleteMutation = useDeleteClothingMutation(wardrobeId, clothingId);") &&
    includes(screenTarget, "await deleteMutation.mutateAsync();"),
  "ClothingDetailScreen.tsx に削除Mutation連携が不足しています",
);

check(
  "CDL-02",
  "削除確認ダイアログの文言に共通文言（削除しますか？）を使用する",
  includes(screenTarget, "COMMON_STRINGS.dialogs.confirmDelete.title") &&
    includes(screenTarget, "COMMON_STRINGS.dialogs.confirmDelete.message") &&
    includes(screenTarget, "<ConfirmDialog") &&
    !includes(screenTarget, "window.confirm("),
  "削除確認ダイアログの自前実装または共通文言参照が不足しています",
);

check(
  "CDL-03",
  "削除成功時に服一覧へ遷移する",
  includes(screenTarget, "router.push(appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingDeleted));"),
  "削除成功後の一覧遷移が不足しています",
);

check(
  "CDL-04",
  "削除失敗時にエラー文言でトースト通知する",
  includes(screenTarget, 'title: CLOTHING_STRINGS.detail.messages.deleteError') &&
    includes(stringsTarget, 'deleteError: "服の削除に失敗しました。"'),
  "削除失敗時のエラー通知実装または文言定義が不足しています",
);

check(
  "CDL-05",
  "OverflowMenu がリンク遷移だけでなく onSelect アクションを実行できる",
  includes(menuTarget, "onSelect?: () => void;") &&
    includes(menuTarget, "action.onSelect?.();") &&
    includes(menuTarget, "<button") &&
    includes(menuTarget, "{action.href ? ("),
  "OverflowMenu のアクション実行対応が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
