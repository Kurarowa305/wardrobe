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
const pageTarget = "src/app/histories/detail/page.tsx";
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
  includes(target, "useHistory") &&
    includes(target, "const historyQuery = useHistory(wardrobeId, historyId);") &&
    includes(target, "historyQuery.isPending") &&
    includes(target, "historyQuery.isError") &&
    includes(target, "resolveErrorMessage(historyQuery.error)"),
  "useHistory を使った詳細取得または状態表示の実装が不足しています",
);

check(
  "HDS-03",
  "履歴詳細画面が日付・入力方法・テンプレート情報・着用服一覧を表示する",
  includes(target, "formatHistoryDate(historyQuery.data.date)") &&
    includes(target, "HISTORY_STRINGS.labels.inputType[historyQuery.data.inputType]") &&
    !includes(target, "historyQuery.data.templateName ?? HISTORY_STRINGS.detail.messages.combinationSummary") &&
    includes(target, "historyQuery.data.template ? (") &&
    includes(target, "historyQuery.data.template.name") &&
    includes(target, "historyQuery.data.template.wearCount") &&
    includes(target, "historyQuery.data.clothingItems.map((item) => {") &&
    includes(target, "item.wearCount") &&
    !includes(target, "formatLastWornDate(") &&
    !includes(target, "templateLastWornAt") &&
    !includes(target, "clothingLastWornAt") &&
    !includes(target, "neverWorn"),
  "履歴詳細の主要表示項目、または最後に着た日行削除の実装が不足しています",
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
  "履歴詳細画面のヘッダーメニューに削除のみがある",
  includes(target, "headerActions:") &&
    !includes(target, "HISTORY_STRINGS.detail.menu.edit") &&
    includes(target, "HISTORY_STRINGS.detail.menu.delete"),
  "ヘッダーメニューの削除項目、または編集項目の除去が不足しています",
);

check(
  "HDS-06",
  "履歴詳細ページが query パラメータから wardrobeId/historyId を解決し、screen へ渡す",
  includes(pageTarget, 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(pageTarget, "useHistoryRouteIdsFromQuery") &&
    includes(pageTarget, "const { wardrobeId, historyId } = useHistoryRouteIdsFromQuery();") &&
    includes(pageTarget, "return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;") &&
    includes(pageTarget, "<Suspense") &&
    includes(
      pageTarget,
      "fallback={<HistoryDetailScreen wardrobeId={DEMO_IDS.wardrobe} historyId={DEMO_IDS.history} />}",
    ),
  "履歴詳細ページの query 解決または HistoryDetailScreen への受け渡しが不足しています",
);

check(
  "HDS-07",
  "history strings に履歴詳細画面向けの文言が定義される",
  includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'error: "履歴詳細の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'notFound: "履歴が見つかりませんでした。"') &&
    includes(stringsTarget, 'template: "着たテンプレート"') &&
    includes(stringsTarget, 'templateWearCount: "着た回数"') &&
    includes(stringsTarget, 'clothingItems: "着た服"') &&
    includes(stringsTarget, 'clothingDeleted: "削除済みの服です"') &&
    !includes(stringsTarget, 'templateLastWornAt: "最後に着た日"') &&
    !includes(stringsTarget, 'clothingLastWornAt: "最後に着た日"') &&
    !includes(stringsTarget, 'neverWorn: "未着用"'),
  "履歴詳細向け文言の定義整理が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
