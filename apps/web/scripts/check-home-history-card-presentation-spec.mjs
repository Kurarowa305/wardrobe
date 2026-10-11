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

const sharedTarget = "src/components/app/history/HistoryCard.tsx";
const homeTarget = "src/components/app/screens/HomeTabScreen.tsx";

check(
  "HHCP-01",
  "ホームは履歴表示を撤去し、履歴一覧に共通カードを保持する",
  !includes(homeTarget, "SharedHistoryCard") &&
    includes("src/components/app/screens/HistoriesTabScreen.tsx", "SharedHistoryCard"),
  "ホーム撤去または履歴一覧の共通カードが期待と異なります",
);

check(
  "HHCP-02",
  "共通履歴カードが日付表示・入力方法ラベル非表示・タイトル省略の表示仕様を持つ",
  includes(sharedTarget, 'const HISTORY_CARD_TITLE_MAX_LENGTH = 15;') &&
    includes(sharedTarget, '{formatHistoryDate(item.date)}') &&
    !includes(sharedTarget, "HISTORY_STRINGS.labels.inputType[item.inputType]") &&
    !includes(sharedTarget, "contextLabel") &&
    includes(sharedTarget, 'title.slice(0, HISTORY_CARD_TITLE_MAX_LENGTH)}...'),
  "共通履歴カードに不要な入力方法ラベルが残っているか、必要な表示仕様が不足しています",
);

check(
  "HHCP-03",
  "共通履歴カードがテンプレート名・服名連結・詳細導線を入力元に応じて切り替える",
  includes(sharedTarget, 'item.inputType === "template"') &&
    includes(sharedTarget, 'const combinationTitle = item.clothingItems.map((clothingItem) => clothingItem.name).join("+");') &&
    includes(sharedTarget, 'href={ROUTES.historyDetail(wardrobeId, item.historyId, from)}'),
  "共通履歴カードのタイトル切り替えまたは詳細導線が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
