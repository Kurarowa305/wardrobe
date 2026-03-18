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

const target = "src/components/app/screens/HistoryDetailScreen.tsx";
const pageTarget = "src/app/wardrobes/[wardrobeId]/(stack)/histories/[historyId]/page.tsx";
const stringsTarget = "src/features/history/strings.ts";

check(
  "HDS-01",
  "履歴詳細画面が src/components/app/screens/HistoryDetailScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "HDS-02",
  "履歴詳細画面が useHistory を利用し、ロード/エラー状態を表示する",
  includes(target, 'import { useHistory } from "@/api/hooks/history";') &&
    includes(target, "const historyQuery = useHistory(wardrobeId, historyId);") &&
    includes(target, "historyQuery.isPending") &&
    includes(target, "historyQuery.isError") &&
    includes(target, "resolveErrorMessage(historyQuery.error)"),
  "useHistory を使った詳細取得または状態表示の実装が不足しています",
);

check(
  "HDS-03",
  "履歴詳細画面が日付・入力方法・着用服一覧を表示する",
  includes(target, "formatHistoryDate(historyQuery.data.date)") &&
    includes(target, "HISTORY_STRINGS.labels.inputType[historyQuery.data.inputType]") &&
    includes(target, "historyQuery.data.templateName ?? HISTORY_STRINGS.detail.messages.combinationSummary") &&
    includes(target, "historyQuery.data.clothingItems.map((item) => {") &&
    includes(target, "item.wearCount") &&
    includes(target, "formatLastWornAt(item.lastWornAt)"),
  "履歴詳細の主要表示項目または着用服一覧が不足しています",
);

check(
  "HDS-04",
  "着用服一覧が非リンク表示で、画像/プレースホルダ/削除済み表示に対応する",
  !includes(target, "import Link from \"next/link\";") &&
    !includes(target, "ROUTES.clothingDetail(") &&
    includes(target, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(target, "const imageUrl = resolveImageUrl(item.imageKey);") &&
    includes(target, "COMMON_STRINGS.placeholders.noImage") &&
    includes(target, "HISTORY_STRINGS.detail.messages.clothingDeleted"),
  "着用服一覧の非リンク表示・画像表示・削除済み表示の実装が不足しています",
);

check(
  "HDS-05",
  "履歴詳細画面のヘッダーメニューに編集/削除がある",
  includes(target, "headerActions:") &&
    includes(target, "HISTORY_STRINGS.detail.menu.edit") &&
    includes(target, "HISTORY_STRINGS.detail.menu.delete"),
  "ヘッダーメニューの編集/削除項目が不足しています",
);

check(
  "HDS-06",
  "履歴詳細ページが historyId を screen に渡し、fixture と mock ID の静的パスを生成する",
  includes(pageTarget, 'import { historyDetailFixtures } from "@/mocks/fixtures/history";') &&
    includes(pageTarget, "const MOCK_HISTORY_ID_PREFIX = \"hs_mock_\";") &&
    includes(pageTarget, "const MOCK_HISTORY_STATIC_PARAMS_COUNT = 200;") &&
    includes(pageTarget, "...historyDetailFixtures.map((fixture) => fixture.historyId),") &&
    includes(pageTarget, "...generateMockStaticHistoryIds(),") &&
    includes(pageTarget, "wardrobeId: DEMO_IDS.wardrobe,") &&
    includes(pageTarget, "return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;"),
  "履歴詳細ページの静的パス生成または historyId 受け渡しが不足しています",
);

check(
  "HDS-07",
  "history strings に履歴詳細画面向けの文言が定義される",
  includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'error: "履歴詳細の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'notFound: "履歴が見つかりませんでした。"') &&
    includes(stringsTarget, 'clothingItems: "着用した服"') &&
    includes(stringsTarget, 'clothingDeleted: "削除済みの服です"') &&
    includes(stringsTarget, 'neverWorn: "未着用"'),
  "履歴詳細向け文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
