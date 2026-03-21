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

const dateTarget = "src/features/history/date.ts";
const cardTarget = "src/components/app/history/HistoryCard.tsx";
const detailTarget = "src/components/app/screens/HistoryDetailScreen.tsx";
const packageTarget = "package.json";
const ciTarget = "../../.github/workflows/ci.yml";

check(
  "HWD-01",
  "履歴日付フォーマッタが曜日付きの YYYY/MM/DD (曜) 形式を返す",
  includes(dateTarget, 'const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;') &&
    includes(dateTarget, 'const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];') &&
    includes(dateTarget, 'return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)} (${weekday})`;'),
  "曜日付き日付フォーマッタの実装が不足しています",
);

check(
  "HWD-02",
  "履歴カードが曜日付き日付フォーマッタを利用する",
  includes(cardTarget, 'import { formatHistoryDate } from "@/features/history/date";') &&
    includes(cardTarget, '{formatHistoryDate(item.date)}'),
  "履歴カードで曜日付き日付フォーマッタが利用されていません",
);

check(
  "HWD-03",
  "履歴詳細画面が曜日付き日付フォーマッタを利用する",
  includes(detailTarget, 'import { formatHistoryDate } from "@/features/history/date";') &&
    includes(detailTarget, '{formatHistoryDate(historyQuery.data.date)}'),
  "履歴詳細画面で曜日付き日付フォーマッタが利用されていません",
);

check(
  "HWD-04",
  "曜日付き日付表示のテストスクリプトが package script と CI に登録される",
  includes(packageTarget, '"test:history-date-weekday": "node scripts/check-history-date-weekday-spec.mjs"') &&
    includes(ciTarget, 'History date weekday spec test') &&
    includes(ciTarget, 'pnpm --filter web test:history-date-weekday'),
  "曜日付き日付表示のテストスクリプト登録またはCI適用が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
