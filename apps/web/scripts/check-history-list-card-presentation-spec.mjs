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

const target = "src/components/app/screens/HistoriesTabScreen.tsx";
const sharedTarget = "src/components/app/history/HistoryCard.tsx";
const dateTarget = "src/features/history/date.ts";

check(
  "HLCP-01",
  "履歴カードの日付表示が YYYY/MM/DD (曜) 形式で整形される",
  includes(target, 'import { SharedHistoryCard } from "@/components/app/history/HistoryCard";') &&
    includes(target, '<SharedHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} from="histories" />') &&
    includes(sharedTarget, 'import { formatHistoryDate } from "@/features/history/date";') &&
    includes(sharedTarget, '{formatHistoryDate(item.date)}') &&
    includes(dateTarget, 'return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)} (${weekday})`;'),
  "履歴カードの日付整形実装が不足しています",
);

check(
  "HLCP-02",
  "入力方法ラベルがカード右上に控えめなスタイルで表示される",
  includes(sharedTarget, 'className="flex items-start justify-between gap-3"') &&
    includes(sharedTarget, 'className="text-[11px] font-medium text-slate-400">{contextLabel}</span>'),
  "入力方法ラベルの右上配置または控えめなスタイル指定が不足しています",
);

check(
  "HLCP-03",
  "テンプレート入力はテンプレート名、組み合わせ入力は服名連結をタイトル表示する",
  includes(sharedTarget, 'const combinationTitle = item.clothingItems.map((clothingItem) => clothingItem.name).join("+");') &&
    includes(sharedTarget, 'item.inputType === "template"') &&
    includes(sharedTarget, 'item.name ?? HISTORY_STRINGS.list.messages.combinationSummary') &&
    includes(sharedTarget, 'combinationTitle || HISTORY_STRINGS.list.messages.combinationSummary'),
  "履歴カードタイトルの入力種別ごとの切り替え実装が不足しています",
);

check(
  "HLCP-04",
  "履歴カードタイトルが15文字超過時に省略表示される",
  includes(sharedTarget, 'const HISTORY_CARD_TITLE_MAX_LENGTH = 15;') &&
    includes(sharedTarget, 'title.length > HISTORY_CARD_TITLE_MAX_LENGTH') &&
    includes(sharedTarget, 'title.slice(0, HISTORY_CARD_TITLE_MAX_LENGTH)}...'),
  "履歴カードタイトルの15文字省略実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
