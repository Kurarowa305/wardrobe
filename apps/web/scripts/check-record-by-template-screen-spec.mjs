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

check("RBTS-01", "テンプレート記録画面が存在する", exists(target), `${target} が存在しません`);

check(
  "RBTS-02",
  "テンプレート記録画面が client component として AppLayout を利用する",
  includes(target, '"use client";') &&
    includes(target, 'title={RECORD_STRINGS.byTemplate.title}') &&
    includes(target, 'backHref={ROUTES.recordMethod(wardrobeId)}'),
  "client component 化または AppLayout の title/backHref 設定が不足しています",
);

check(
  "RBTS-03",
  "日付入力とテンプレート選択UIを表示する",
  includes(target, 'type="date"') &&
    includes(target, 'RECORD_STRINGS.byTemplate.labels.date') &&
    includes(target, 'RECORD_STRINGS.byTemplate.labels.template') &&
    includes(target, 'type="radio"'),
  "日付入力またはテンプレート単一選択UIが不足しています",
);

check(
  "RBTS-04",
  "履歴作成時に日付を yyyy-mm-dd から yyyymmdd へ変換して templateId とともに送る",
  includes(target, 'function formatDateForApi(value: string)') &&
    includes(target, 'return value.replaceAll("-", "");') &&
    includes(target, 'date: formatDateForApi(date),') &&
    includes(target, 'templateId: selectedTemplateId,'),
  "API向け日付変換または createHistory payload 定義が不足しています",
);

check(
  "RBTS-05",
  "送信成功後にホームへ遷移し、追加読み込み導線を持つ",
  includes(target, 'router.push(ROUTES.home(wardrobeId));') &&
    includes(target, 'const handleLoadMore = () => {') &&
    includes(target, 'RECORD_STRINGS.byTemplate.actions.loadMore'),
  "成功時ホーム遷移または load more 導線が不足しています",
);

check(
  "RBTS-06",
  "テンプレート記録画面向け文言が record strings に定義される",
  includes(stringsTarget, 'loadMore: "テンプレートをさらに読み込む"') &&
    includes(stringsTarget, 'loading: "テンプレート一覧を読み込み中..."') &&
    includes(stringsTarget, 'templateRequired: "テンプレートを選択してください。"') &&
    includes(stringsTarget, 'submitError: "テンプレートでの記録に失敗しました。"'),
  "features/record/strings.ts にテンプレート記録画面向け文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
