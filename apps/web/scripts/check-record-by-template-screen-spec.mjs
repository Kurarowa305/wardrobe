import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
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

const target = "src/components/app/screens/RecordByTemplateScreen.tsx";
const stringsTarget = "src/features/record/strings.ts";

check(
  "RBTS-01",
  "テンプレートで記録画面が client component として存在する",
  exists(target) && includes(target, '"use client";') && includes(target, "export function RecordByTemplateScreen"),
  "RecordByTemplateScreen の存在または client component 宣言が不足しています",
);

check(
  "RBTS-02",
  "画面が useTemplateList を limit/cursor 付きで利用し、ページ蓄積を行う",
  includes(target, 'import { useTemplateList } from "@/api/hooks/template";') &&
    includes(target, "const TEMPLATE_PAGE_SIZE = 20;") &&
    includes(target, "useTemplateList(wardrobeId, {") &&
    includes(target, "limit: TEMPLATE_PAGE_SIZE,") &&
    includes(target, "cursor,") &&
    includes(target, "setPages((previous) => {") &&
    includes(target, "setNextCursor(templateListQuery.data.nextCursor);"),
  "テンプレート一覧のページング取得またはページ蓄積処理が不足しています",
);

check(
  "RBTS-03",
  "日付入力とテンプレート単一選択 UI を持つ",
  includes(target, 'type="date"') &&
    includes(target, "RECORD_STRINGS.byTemplate.labels.date") &&
    includes(target, 'type="radio"') &&
    includes(target, 'name="templateId"') &&
    includes(target, "RECORD_STRINGS.byTemplate.labels.template"),
  "日付入力またはテンプレート単一選択 UI が不足しています",
);

check(
  "RBTS-04",
  "送信時に useCreateHistoryMutation で date/templateId を渡してホームへ戻る",
  includes(target, 'import { useCreateHistoryMutation } from "@/api/hooks/history";') &&
    includes(target, "const createHistoryMutation = useCreateHistoryMutation(wardrobeId);") &&
    includes(target, "date: toApiDate(date),") &&
    includes(target, "templateId: selectedTemplateId,") &&
    includes(target, "router.push(ROUTES.home(wardrobeId));"),
  "履歴作成 mutation または完了後のホーム遷移が不足しています",
);

check(
  "RBTS-05",
  "読込中・空状態・読込失敗・必須エラー・送信失敗の文言表示を持つ",
  includes(target, "RECORD_STRINGS.byTemplate.messages.loading") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.empty") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.loadError") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.dateRequired") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.templateRequired") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.submitError"),
  "必要な状態表示/エラー表示のいずれかが不足しています",
);

check(
  "RBTS-06",
  "さらに読み込むとキャンセル導線がある",
  includes(target, "RECORD_STRINGS.byTemplate.actions.loadMore") &&
    includes(target, "onClick={handleLoadMore}") &&
    includes(target, "RECORD_STRINGS.actions.cancel") &&
    includes(target, "router.push(ROUTES.recordMethod(wardrobeId))"),
  "さらに読み込む導線またはキャンセル導線が不足しています",
);

check(
  "RBTS-07",
  "record strings にテンプレート記録画面の状態文言と共通キャンセル文言が定義される",
  includes(stringsTarget, 'cancel: "キャンセル"') &&
    includes(stringsTarget, 'loadMore: "さらに読み込む"') &&
    includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'empty: "記録に使えるテンプレートがありません。"') &&
    includes(stringsTarget, 'loadError: "テンプレート一覧の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'dateRequired: "日付を入力してください。"') &&
    includes(stringsTarget, 'templateRequired: "テンプレートを選択してください。"') &&
    includes(stringsTarget, 'submitting: "記録中..."') &&
    includes(stringsTarget, 'submitError: "記録の作成に失敗しました。"'),
  "record strings の文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
