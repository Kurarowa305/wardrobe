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

const dateTarget = "src/lib/date.ts";
const clothingTarget = "src/components/app/screens/ClothingDetailScreen.tsx";
const templateTarget = "src/components/app/screens/TemplateDetailScreen.tsx";
const historyTarget = "src/components/app/screens/HistoryDetailScreen.tsx";
const packageTarget = "package.json";
const ciTarget = "../../.github/workflows/ci.yml";

check(
  "LWW-01",
  "共通日付ユーティリティがタイムスタンプを YYYY/MM/DD (曜) 形式へ変換する",
  includes(dateTarget, 'const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;') &&
    includes(dateTarget, 'function pad2(value: number) {') &&
    includes(dateTarget, 'const weekday = WEEKDAY_LABELS[date.getDay()];') &&
    includes(dateTarget, 'return `${year}/${pad2(month)}/${pad2(day)} (${weekday})`;'),
  "曜日付き最終着用日フォーマッタの実装が不足しています",
);

check(
  "LWW-02",
  "服詳細画面が共通ユーティリティで最終着用日を曜日付き表示する",
  includes(clothingTarget, 'import { formatTimestampDateWithWeekday } from "@/lib/date";') &&
    includes(clothingTarget, 'return formatTimestampDateWithWeekday(lastWornAt);') &&
    includes(clothingTarget, 'formatLastWornAt(clothingQuery.data.lastWornAt)'),
  "服詳細画面の曜日付き最終着用日表示が不足しています",
);

check(
  "LWW-03",
  "テンプレート詳細画面が共通ユーティリティで最終着用日を曜日付き表示する",
  includes(templateTarget, 'import { formatTimestampDateWithWeekday } from "@/lib/date";') &&
    includes(templateTarget, 'return formatTimestampDateWithWeekday(lastWornAt);') &&
    includes(templateTarget, 'formatLastWornAt(templateQuery.data.lastWornAt)') &&
    includes(templateTarget, 'formatLastWornAt(item.lastWornAt)'),
  "テンプレート詳細画面の曜日付き最終着用日表示が不足しています",
);

check(
  "LWW-04",
  "履歴詳細画面が共通ユーティリティで最終着用日を曜日付き表示する",
  includes(historyTarget, 'import { formatTimestampDateWithWeekday } from "@/lib/date";') &&
    includes(historyTarget, 'return formatTimestampDateWithWeekday(lastWornAt);') &&
    includes(historyTarget, 'formatLastWornAt(historyQuery.data.template.lastWornAt)') &&
    includes(historyTarget, 'formatLastWornAt(item.lastWornAt)'),
  "履歴詳細画面の曜日付き最終着用日表示が不足しています",
);

check(
  "LWW-05",
  "最終着用日曜日表示テストが package script と CI に登録される",
  includes(packageTarget, '"test:last-worn-at-weekday": "node scripts/check-last-worn-at-weekday-spec.mjs"') &&
    includes(ciTarget, 'Last worn at weekday spec test') &&
    includes(ciTarget, 'pnpm --filter web test:last-worn-at-weekday'),
  "最終着用日曜日表示テストの script または CI 設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
