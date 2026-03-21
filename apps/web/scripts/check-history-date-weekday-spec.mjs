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
  failures.push(`FAIL ${id}: ${description}
  ${detail}`);
}

const dateTarget = "src/features/history/date.ts";
const historyCardTarget = "src/components/app/history/HistoryCard.tsx";
const historyDetailTarget = "src/components/app/screens/HistoryDetailScreen.tsx";
const clothingDetailTarget = "src/components/app/screens/ClothingDetailScreen.tsx";
const templateDetailTarget = "src/components/app/screens/TemplateDetailScreen.tsx";

check(
  "HDW-01",
  "履歴日付フォーマッタが曜日付き YYYY/MM/DD (曜) を返す",
  includes(dateTarget, 'const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;') &&
    includes(dateTarget, 'return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)} (${weekday})`;'),
  "履歴日付フォーマッタの曜日付き整形実装が不足しています",
);

check(
  "HDW-02",
  "最終着用日フォーマッタが曜日付き日付と未着用ラベルを扱う",
  includes(dateTarget, 'export function formatLastWornDate(lastWornAt: number | null, neverWornLabel: string) {') &&
    includes(dateTarget, 'return neverWornLabel;') &&
    includes(dateTarget, 'return `${formatted} (${weekday})`;'),
  "最終着用日フォーマッタの共通化または曜日付き整形実装が不足しています",
);

check(
  "HDW-03",
  "履歴カードが共通フォーマッタで曜日付き日付を表示する",
  includes(historyCardTarget, 'import { formatHistoryDate } from "@/features/history/date";') &&
    includes(historyCardTarget, '{formatHistoryDate(item.date)}'),
  "履歴カードの日付表示が共通フォーマッタを利用していません",
);

check(
  "HDW-04",
  "履歴詳細画面が日付に曜日を付け、テンプレート最終着用日の行を削除する",
  includes(historyDetailTarget, 'formatHistoryDate(historyQuery.data.date)') &&
    includes(historyDetailTarget, 'formatLastWornDate(historyQuery.data.template.lastWornAt, HISTORY_STRINGS.detail.messages.neverWorn)') &&
    includes(historyDetailTarget, 'formatLastWornDate(item.lastWornAt, HISTORY_STRINGS.detail.messages.neverWorn)') &&
    !includes(historyDetailTarget, 'HISTORY_STRINGS.detail.labels.templateLastWornAt') &&
    !includes(historyDetailTarget, '最後に着た日: {formatLastWornAt('),
  "履歴詳細画面の曜日表示追加またはテンプレート最終着用日行の削除が不足しています",
);

check(
  "HDW-05",
  "服詳細とテンプレート詳細の最終着用日も曜日付き共通フォーマッタを使う",
  includes(clothingDetailTarget, 'formatLastWornDate(clothingQuery.data.lastWornAt, CLOTHING_STRINGS.detail.messages.neverWorn)') &&
    includes(templateDetailTarget, 'formatLastWornDate(templateQuery.data.lastWornAt, TEMPLATE_STRINGS.detail.messages.neverWorn)') &&
    includes(templateDetailTarget, 'formatLastWornDate(item.lastWornAt, TEMPLATE_STRINGS.detail.messages.neverWorn)'),
  "服詳細またはテンプレート詳細の最終着用日が曜日付き共通フォーマッタを利用していません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
