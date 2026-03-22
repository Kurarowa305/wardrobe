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

const target = "src/components/app/screens/HistoriesTabScreen.tsx";
const stringsTarget = "src/features/history/strings.ts";
const cardTarget = "src/components/app/history/HistoryCard.tsx";

check(
  "HLS-01",
  "履歴一覧画面が src/components/app/screens/HistoriesTabScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "HLS-02",
  "履歴一覧画面が useHistoryList を利用し、cursorページングでデータ取得する",
  includes(target, '"use client";') &&
    includes(target, 'import { useHistoryList } from "@/api/hooks/history";') &&
    includes(target, "const HISTORY_LIST_PAGE_SIZE = 20;") &&
    includes(target, "useHistoryList(wardrobeId, {") &&
    includes(target, "limit: HISTORY_LIST_PAGE_SIZE,") &&
    includes(target, "cursor,"),
  "useHistoryList または cursor/limit 指定が不足しています",
);

check(
  "HLS-03",
  "履歴一覧画面が読込中・空状態・読込失敗の表示文言を持つ",
  includes(target, "HISTORY_STRINGS.list.messages.loading") &&
    includes(target, "HISTORY_STRINGS.list.messages.empty") &&
    includes(target, "HISTORY_STRINGS.list.messages.error"),
  "読込/空/エラー状態の文言表示が不足しています",
);

check(
  "HLS-04",
  "履歴カードが詳細遷移導線を持ち、入力方法ラベルを表示しない",
  includes(target, 'import { SharedHistoryCard } from "@/components/app/history/HistoryCard";') &&
    includes(target, '<SharedHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} from="histories" />') &&
    includes(cardTarget, 'href={ROUTES.historyDetail(wardrobeId, item.historyId, from)}') &&
    !includes(cardTarget, 'HISTORY_STRINGS.labels.inputType[item.inputType]') &&
    !includes(cardTarget, 'contextLabel') &&
    includes(cardTarget, 'combinationTitle || HISTORY_STRINGS.list.messages.combinationSummary'),
  "履歴詳細遷移導線または入力方法ラベル非表示の実装が不足しています",
);

check(
  "HLS-05",
  "履歴カードがサムネ表示で resolveImageUrl/no image/削除済みオーバーレイに対応する",
  includes(cardTarget, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(cardTarget, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(cardTarget, '<ThumbnailStrip') &&
    includes(cardTarget, 'HISTORY_STRINGS.list.badges.deleted'),
  "履歴カードのサムネ表示実装が不足しています",
);

check(
  "HLS-06",
  "履歴カードがサムネ5列レイアウトの共通コンポーネントを利用する",
  includes(cardTarget, 'import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";') &&
    includes(cardTarget, '<ThumbnailStrip') &&
    includes(cardTarget, 'deletedLabel={HISTORY_STRINGS.list.badges.deleted}'),
  "履歴カードで共通サムネイルレイアウトの利用が不足しています",
);

check(
  "HLS-07",
  "nextCursor がある場合に『さらに読み込む』で追加取得できる",
  includes(target, "const [nextCursor, setNextCursor] = useState<string | null>(null);") &&
    includes(target, "setNextCursor(data.nextCursor);") &&
    includes(target, "setCursor(nextCursor);") &&
    includes(target, "HISTORY_STRINGS.list.actions.loadMore") &&
    includes(target, "onClick={handleLoadMore}"),
  "nextCursor を使った追加読み込み導線が不足しています",
);

check(
  "HLS-08",
  "履歴一覧画面向けの文言が history strings に定義される",
  includes(stringsTarget, 'loadMore: "さらに読み込む"') &&
    includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'empty: "履歴がまだ登録されていません。"') &&
    includes(stringsTarget, 'error: "履歴一覧の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'combinationSummary: "選択した服の組み合わせ"') &&
    includes(stringsTarget, 'deleted: "削除済み"'),
  "features/history/strings.ts に一覧状態文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
