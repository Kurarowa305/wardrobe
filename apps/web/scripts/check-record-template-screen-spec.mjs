import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function includes(relativePath, snippet) {
  return read(relativePath).includes(snippet);
}

const results = [];

function check(id, description, predicate, failureDetail) {
  try {
    const passed = Boolean(predicate());
    results.push({ id, description, passed, detail: passed ? "ok" : failureDetail });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ id, description, passed: false, detail: `unexpected error: ${message}` });
  }
}

const target = "src/components/app/screens/RecordByTemplateScreen.tsx";
const stringsTarget = "src/features/record/strings.ts";

check("RTS-01", "テンプレート記録画面が所定ファイルに存在する", () => exists(target), `${target} が存在しません`);
check(
  "RTS-02",
  "AppLayout でタイトルと戻り先が記録方法選択に設定される",
  () => includes(target, 'title={RECORD_STRINGS.byTemplate.title}') && includes(target, 'backHref={ROUTES.recordMethod(wardrobeId)}'),
  "AppLayout のタイトルまたは戻り先設定が不足しています",
);
check(
  "RTS-03",
  "日付入力欄が date input と必須エラーメッセージ付きで実装される",
  () => includes(target, 'type="date"') && includes(target, 'RECORD_STRINGS.byTemplate.labels.date') && includes(target, 'RECORD_STRINGS.byTemplate.messages.dateRequired'),
  "日付入力欄または必須エラーメッセージの実装が不足しています",
);
check(
  "RTS-04",
  "テンプレート一覧取得に template query hook を用い、単一選択 UI を描画する",
  () => includes(target, 'useTemplateList(wardrobeId') && includes(target, 'type="radio"') && includes(target, 'selectedTemplateId'),
  "テンプレート一覧取得または単一選択 UI の実装が不足しています",
);
check(
  "RTS-05",
  "選択中テンプレートを服リスト上部の別カードとして表示し、一覧側からは除外する",
  () =>
    includes(target, "selectedTemplate") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.selected") &&
    includes(target, "TemplatePreviewCard item={selectedTemplate} selected") &&
    includes(target, "templateItems.filter((item) => item.templateId !== selectedTemplateId)"),
  "選択中テンプレートの別カード表示または一覧除外の実装が不足しています",
);
check(
  "RTS-06",
  "テンプレート一覧カードと選択中カードが下部サムネイルを最大4枚まで表示する",
  () =>
    includes(target, "const TEMPLATE_THUMBNAIL_LIMIT = 4;") &&
    includes(target, "resolveImageUrl(item.imageKey)") &&
    includes(target, "alt=\"テンプレート構成服のサムネイル\"") &&
    includes(target, "item.clothingItems.slice(0, TEMPLATE_THUMBNAIL_LIMIT)") &&
    includes(target, "COMMON_STRINGS.placeholders.noImage"),
  "テンプレート一覧向けサムネイル表示の実装が不足しています",
);
check(
  "RTS-07",
  "記録ボタンが画面下部に固定表示される",
  () =>
    includes(target, 'className="grid gap-3 pb-24"') &&
    includes(target, 'className="fixed bottom-0 left-1/2 z-20 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"'),
  "記録ボタンの固定表示実装が不足しています",
);
check(
  "RTS-08",
  "記録ボタンが create history mutation を呼び、API仕様の yyyymmdd に変換した templateId で履歴を作成する",
  () => includes(target, 'useCreateHistoryMutation(wardrobeId)') && includes(target, 'function toHistoryApiDate(dateInputValue: string)') && includes(target, 'dateInputValue.replaceAll("-", "")') && includes(target, 'templateId: selectedTemplateId') && includes(target, 'date: historyApiDate,'),
  "履歴作成 mutation の payload または日付変換処理が不足しています",
);
check(
  "RTS-09",
  "記録成功後にホームへ戻る",
  () => includes(target, 'router.push(ROUTES.home(wardrobeId))'),
  "記録完了後のホーム遷移実装が不足しています",
);
check(
  "RTS-10",
  "テンプレート記録向け文言が record strings に定義される",
  () => includes(stringsTarget, 'selected: "選択中のテンプレート"') && includes(stringsTarget, 'dateRequired: "日付を入力してください。"') && includes(stringsTarget, 'templateRequired: "テンプレートを選択してください。"') && includes(stringsTarget, 'loading: "テンプレートを読み込んでいます…"') && includes(stringsTarget, 'submitError: "記録に失敗しました。時間をおいて再度お試しください。"'),
  "features/record/strings.ts にテンプレート記録向け文言の定義が不足しています",
);

let hasFailure = false;
for (const result of results) {
  const icon = result.passed ? "✅" : "❌";
  console.log(`${icon} ${result.id}: ${result.description}`);
  if (!result.passed) {
    console.log(`   ${result.detail}`);
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log("\nRecord by template screen spec checks passed.");
}
