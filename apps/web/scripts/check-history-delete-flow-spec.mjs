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

const screenTarget = "src/components/app/screens/HistoryDetailScreen.tsx";
const stringsTarget = "src/features/history/strings.ts";

check(
  "HDL-01",
  "履歴詳細画面で useDeleteHistoryMutation を利用して削除処理を実行する",
  includes(screenTarget, 'import { useHistory, useDeleteHistoryMutation } from "@/api/hooks/history";') &&
    includes(screenTarget, "const deleteMutation = useDeleteHistoryMutation(wardrobeId, historyId);") &&
    includes(screenTarget, "await deleteMutation.mutateAsync();"),
  "HistoryDetailScreen.tsx に削除Mutation連携が不足しています",
);

check(
  "HDL-02",
  "削除確認ダイアログの文言に共通文言（削除しますか？）を使用する",
  includes(screenTarget, "COMMON_STRINGS.dialogs.confirmDelete.title") &&
    includes(screenTarget, "COMMON_STRINGS.dialogs.confirmDelete.message") &&
    includes(screenTarget, "window.confirm("),
  "削除確認の実装または共通文言参照が不足しています",
);

check(
  "HDL-03",
  "削除成功時に from 文脈から解決した戻り先へ遷移する",
  includes(screenTarget, 'import { useRouter, useSearchParams } from "next/navigation";') &&
    includes(screenTarget, "const router = useRouter();") &&
    includes(screenTarget, 'const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));') &&
    includes(screenTarget, "router.push(backHref);"),
  "削除成功後の文脈付き戻り先遷移が不足しています",
);

check(
  "HDL-04",
  "削除失敗時にエラー文言でトースト通知する",
  includes(screenTarget, 'import { useToast } from "@/components/ui/use-toast";') &&
    includes(screenTarget, 'title: HISTORY_STRINGS.detail.messages.deleteError') &&
    includes(stringsTarget, 'deleteError: "履歴の削除に失敗しました。"'),
  "削除失敗時のトースト通知または文言定義が不足しています",
);

check(
  "HDL-05",
  "ヘッダーメニューの削除項目が onSelect と削除中の無効化に対応する",
  includes(screenTarget, 'key: "delete"') &&
    includes(screenTarget, "onSelect: handleDelete") &&
    includes(screenTarget, "deleteMutation.isPending") &&
    includes(screenTarget, "disabled: !historyQuery.data || deleteMutation.isPending"),
  "削除メニューのアクション実行または削除中無効化が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
