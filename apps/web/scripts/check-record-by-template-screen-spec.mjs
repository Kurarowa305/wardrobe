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
const pageTarget = "src/app/wardrobes/[wardrobeId]/(stack)/record/template/page.tsx";
const stringsTarget = "src/features/record/strings.ts";

check(
  "RBTS-01",
  "テンプレート記録画面が src/components/app/screens/RecordByTemplateScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "RBTS-02",
  "テンプレート記録画面が client component として template/history hooks を利用する",
  includes(target, '"use client";') &&
    includes(target, 'import { useCreateHistoryMutation } from "@/api/hooks/history";') &&
    includes(target, 'import { useTemplateList } from "@/api/hooks/template";') &&
    includes(target, "const createHistoryMutation = useCreateHistoryMutation(wardrobeId);") &&
    includes(target, "const templateListQuery = useTemplateList(wardrobeId, {") &&
    includes(target, "limit: RECORD_TEMPLATE_PAGE_SIZE,"),
  "client component 化または hook 連携実装が不足しています",
);

check(
  "RBTS-03",
  "AppLayout でタイトルと記録方法選択画面への戻り導線を定義する",
  includes(target, '<AppLayout title={RECORD_STRINGS.byTemplate.title} backHref={ROUTES.recordMethod(wardrobeId)}>'),
  "AppLayout の title/backHref 設定が不足しています",
);

check(
  "RBTS-04",
  "日付入力とテンプレート単一選択 UI を表示する",
  includes(target, 'name="date"') &&
    includes(target, 'type="date"') &&
    includes(target, 'RECORD_STRINGS.byTemplate.labels.date') &&
    includes(target, 'RECORD_STRINGS.byTemplate.labels.template') &&
    includes(target, 'type="radio"') &&
    includes(target, 'name="templateId"') &&
    includes(target, 'function SelectableTemplateCard(') &&
    includes(target, 'function TemplateThumbnail('),
  "日付入力またはテンプレート単一選択 UI が不足しています",
);

check(
  "RBTS-05",
  "日付未入力・テンプレート未選択でエラー文言を表示し送信不可にする",
  includes(target, "const isDateEmpty = trimmedDate.length === 0;") &&
    includes(target, "const isTemplateEmpty = selectedTemplateId.length === 0;") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.dateRequired") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.templateRequired") &&
    includes(target, "disabled={isDateEmpty || isTemplateEmpty || isPending}"),
  "必須バリデーションまたは送信抑止が不足しています",
);

check(
  "RBTS-06",
  "送信時に createHistoryMutation へ date/templateId を渡し、成功後にホームへ遷移する",
  includes(target, "await createHistoryMutation.mutateAsync({") &&
    includes(target, "date: trimmedDate,") &&
    includes(target, "templateId: selectedTemplateId,") &&
    includes(target, "router.push(ROUTES.home(wardrobeId));"),
  "履歴作成 mutation または成功後遷移が不足しています",
);

check(
  "RBTS-07",
  "テンプレート一覧の loading/error/empty/loadMore 状態を扱い、選択用カードでサムネイルを表示する",
  includes(target, "RECORD_STRINGS.byTemplate.messages.loading") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.loadError") &&
    includes(target, "RECORD_STRINGS.byTemplate.messages.empty") &&
    includes(target, "const [nextCursor, setNextCursor] = useState<string | null>(null);") &&
    includes(target, "setNextCursor(templateListQuery.data.nextCursor);") &&
    includes(target, "RECORD_STRINGS.byTemplate.actions.loadMore") &&
    includes(target, "onClick={handleLoadMore}") &&
    includes(target, "const TEMPLATE_THUMBNAIL_LIMIT = 4;") &&
    includes(target, "item.clothingItems.slice(0, TEMPLATE_THUMBNAIL_LIMIT)"),
  "一覧状態表示・追加読み込み・選択用カードUIのいずれかが不足しています",
);

check(
  "RBTS-08",
  "テンプレート記録ページが RecordByTemplateScreen を描画する",
  includes(pageTarget, 'import { RecordByTemplateScreen } from "@/components/app/screens/RecordByTemplateScreen";') &&
    includes(pageTarget, 'return <RecordByTemplateScreen wardrobeId={wardrobeId} />;'),
  "record/template page.tsx の画面描画が不足しています",
);

check(
  "RBTS-09",
  "テンプレート記録画面向け文言が record strings に定義される",
  includes(stringsTarget, 'loadMore: "テンプレートをさらに読み込む"') &&
    includes(stringsTarget, 'loading: "テンプレートを読み込み中..."') &&
    includes(stringsTarget, 'loadError: "テンプレート一覧の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'empty: "選択できるテンプレートがまだ登録されていません。"') &&
    includes(stringsTarget, 'dateRequired: "日付を入力してください。"') &&
    includes(stringsTarget, 'templateRequired: "記録に使うテンプレートを選択してください。"') &&
    includes(stringsTarget, 'submitting: "記録中..."') &&
    includes(stringsTarget, 'submitError: "履歴の記録に失敗しました。"'),
  "features/record/strings.ts のテンプレート記録画面文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
