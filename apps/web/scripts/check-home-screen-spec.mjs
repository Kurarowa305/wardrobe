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

const screenTarget = "src/components/app/screens/HomeTabScreen.tsx";
const stringsTarget = "src/features/home/strings.ts";
const hooksTarget = "src/api/hooks/history.ts";
const fixtureTarget = "src/mocks/fixtures/history.ts";

check("HS-01", "ホーム画面実装が存在する", exists(screenTarget), `${screenTarget} が存在しません`);

check(
  "HS-02",
  "着た記録ボタンが画面上部に配置される",
  includes(screenTarget, "<div className=\"grid gap-4\">") &&
    includes(screenTarget, "HOME_STRINGS.actions.addRecord") &&
    read(screenTarget).indexOf("HOME_STRINGS.actions.addRecord") <
      read(screenTarget).indexOf("HOME_STRINGS.sections.recentWeekHistories"),
  "着た記録ボタンが履歴セクションより前に配置されていません",
);

check(
  "HS-03",
  "ホーム画面が直近1週間の履歴 hook を利用する",
  includes(screenTarget, 'import { useRecentWeekHistories } from "@/api/hooks/history";') &&
    includes(screenTarget, "const recentWeekHistoriesQuery = useRecentWeekHistories(wardrobeId);") &&
    includes(hooksTarget, "export function useRecentWeekHistories(wardrobeId: string, now = new Date()) {") &&
    includes(hooksTarget, "from.setDate(from.getDate() - 6);") &&
    includes(hooksTarget, 'order: "desc",'),
  "直近1週間の履歴取得 hook または期間指定ロジックが不足しています",
);

check(
  "HS-04",
  "ホーム画面に履歴一覧と空状態文言がある",
  includes(screenTarget, "<HomeHistoryCard") &&
    includes(screenTarget, "HOME_STRINGS.messages.noRecentHistories") &&
    includes(stringsTarget, "noRecentHistories") &&
    includes(stringsTarget, "直近1週間の履歴はまだ登録されていません。"),
  "履歴カード表示または空状態文言の定義が不足しています",
);

check(
  "HS-05",
  "ホーム画面下部に履歴一覧遷移がある",
  includes(screenTarget, "HOME_STRINGS.actions.viewAllHistories") &&
    includes(screenTarget, 'Link href={ROUTES.histories(wardrobeId)}') &&
    read(screenTarget).lastIndexOf("HOME_STRINGS.actions.viewAllHistories") >
      read(screenTarget).indexOf("HOME_STRINGS.sections.recentWeekHistories"),
  "履歴を全て見る導線が履歴セクション下部に配置されていません",
);

check(
  "HS-06",
  "ホーム画面から ScreenCard 依存が削除されている",
  !includes(screenTarget, "ScreenCard") && !includes(screenTarget, "ScreenLinkButton"),
  "HomeTabScreen.tsx に旧 ScreenCard/ScreenLinkButton 依存が残っています",
);

check(
  "HS-07",
  "fixture にホーム画面向け直近7日分の履歴が用意されている",
  [
    'date: "20260321"',
    'date: "20260320"',
    'date: "20260319"',
    'date: "20260318"',
    'date: "20260317"',
    'date: "20260316"',
    'date: "20260315"',
  ].every((value) => includes(fixtureTarget, value)),
  "ホーム画面表示用の直近7日分 fixture が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
