import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;
const target = "src/components/app/screens/HomeTabScreen.tsx";

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function includes(relPath, expected) {
  return read(relPath).includes(expected);
}

function noIncludes(relPath, unexpected) {
  return !read(relPath).includes(unexpected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "HS-01",
  "ホーム画面が ScreenCard を使わず直接描画で構成される",
  noIncludes(target, "ScreenCard") && includes(target, 'className="grid gap-4"'),
  "ホーム画面が直接描画構成になっていません",
);

check(
  "HS-02",
  "+記録するボタンが画面上部に配置される",
  includes(target, 'HOME_STRINGS.actions.addRecord') &&
    includes("src/features/home/strings.ts", 'addRecord: "+記録する"') &&
    includes(target, '<Button asChild className="w-full justify-start text-left text-sm font-medium">') &&
    read(target).indexOf('HOME_STRINGS.actions.addRecord') < read(target).indexOf('HOME_STRINGS.sections.recentWeekHistories'),
  "+記録するボタンが上部アクションとして正しい文言で配置されていません",
);

check(
  "HS-03",
  "ホーム画面が直近1週間分の履歴取得 hook を利用する",
  includes(target, 'import { useRecentHistories } from "@/api/hooks/history";') &&
    includes(target, 'const recentHistoriesQuery = useRecentHistories(wardrobeId, 7);'),
  "直近1週間履歴取得 hook の利用が不足しています",
);

check(
  "HS-04",
  "履歴セクションが loading/error/empty/list の表示分岐を持つ",
  includes(target, 'HOME_STRINGS.messages.loadingRecentHistories') &&
    includes(target, 'HOME_STRINGS.messages.errorRecentHistories') &&
    includes(target, 'HOME_STRINGS.messages.emptyRecentHistories') &&
    includes(target, 'recentHistoriesQuery.data.items.map((item) => ('),
  "履歴セクションの表示分岐が不足しています",
);

check(
  "HS-05",
  "ホーム画面の履歴カードが from=home 付きで履歴詳細に遷移する",
  includes(target, 'href={ROUTES.historyDetail(wardrobeId, item.historyId, "home")}'),
  "ホーム文脈の履歴詳細導線が不足しています",
);

check(
  "HS-06",
  "ホーム画面下部に履歴一覧導線を配置する",
  includes(target, 'HOME_STRINGS.actions.viewAllHistories') &&
    includes(target, 'variant="outline"') &&
    read(target).indexOf('HOME_STRINGS.actions.viewAllHistories') > read(target).indexOf('HOME_STRINGS.sections.recentWeekHistories'),
  "履歴一覧導線が履歴セクション下部に配置されていません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
