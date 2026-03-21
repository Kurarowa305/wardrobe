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

const target = "src/components/app/screens/RecordByCombinationScreen.tsx";
const stringsTarget = "src/features/record/strings.ts";

check("RCS-01", "服組み合わせ記録画面が所定ファイルに存在する", exists(target), `${target} が存在しません`);

check(
  "RCS-02",
  "AppLayout でタイトルと戻り先が記録方法選択に設定される",
  includes(target, 'title={RECORD_STRINGS.byCombination.title}') &&
    includes(target, 'backHref={ROUTES.recordMethod(wardrobeId)}'),
  "AppLayout の title/backHref 設定が不足しています",
);

check(
  "RCS-03",
  "日付入力欄が date input と必須エラーメッセージ付きで実装される",
  includes(target, 'type="date"') &&
    includes(target, 'RECORD_STRINGS.byCombination.labels.date') &&
    includes(target, 'RECORD_STRINGS.byCombination.messages.dateRequired'),
  "日付入力 UI または必須メッセージが不足しています",
);

check(
  "RCS-04",
  "服一覧取得に clothing query hook を用い、複数選択 checkbox を描画する",
  includes(target, 'useClothingList(wardrobeId') &&
    includes(target, 'type="checkbox"') &&
    includes(target, 'toggleClothing(item.clothingId)'),
  "服一覧取得または複数選択 UI が不足しています",
);

check(
  "RCS-05",
  "服一覧がサムネイル付き選択リストとして描画される",
  includes(target, 'function ClothingThumbnail') &&
    includes(target, 'type="checkbox"') &&
    includes(target, 'className="sr-only"') &&
    includes(target, 'alt={`${item.name}のサムネイル`}'),
  "服一覧のサムネイル付き選択リスト実装が不足しています",
);

check(
  "RCS-06",
  "記録ボタンが create history mutation を呼び出し、API仕様の yyyymmdd に変換した服ID配列で履歴を作成する",
  includes(target, 'useCreateHistoryMutation(wardrobeId)') &&
    includes(target, 'function toHistoryApiDate(dateInputValue: string)') &&
    includes(target, 'dateInputValue.replaceAll("-", "")') &&
    includes(target, 'date: historyApiDate,') &&
    includes(target, 'clothingIds: selectedClothingIds'),
  "履歴作成 mutation または yyyymmdd 変換済み payload が不足しています",
);

check(
  "RCS-07",
  "記録成功後にホームへ戻る",
  includes(target, 'router.push(ROUTES.home(wardrobeId));'),
  "記録成功後のホーム遷移が不足しています",
);

check(
  "RCS-08",
  "服組み合わせ記録向け文言が record strings に定義される",
  includes(stringsTarget, 'title: "服の組み合わせで記録"') &&
    includes(stringsTarget, 'clothing: "服"') &&
    !includes(stringsTarget, 'selected: "選択中の服"') &&
    includes(stringsTarget, 'clothingRequired: "服を1着以上選択してください。"'),
  "features/record/strings.ts に服組み合わせ記録向け文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
