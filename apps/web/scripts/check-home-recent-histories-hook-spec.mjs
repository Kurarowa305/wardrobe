import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const target = "src/components/app/screens/HomeTabScreen.tsx";
const packageJson = "package.json";
const ciYaml = path.resolve(webRoot, "..", "..", ".github", "workflows", "ci.yml");
const failures = [];
let checkCount = 0;

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function read(relPath) {
  const filePath = path.isAbsolute(relPath) ? relPath : abs(relPath);
  return fs.readFileSync(filePath, "utf8");
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
  "HRH-01",
  "ホーム画面が useRecentHistories hook を import して利用する",
  includes(target, 'import { useRecentHistories } from "@/api/hooks/history";') &&
    includes(target, 'const recentHistoriesQuery = useRecentHistories(wardrobeId, HOME_RECENT_HISTORY_LIMIT);'),
  "HomeTabScreen で useRecentHistories の利用が不足しています",
);

check(
  "HRH-02",
  "ホーム画面の直近履歴件数が 7 件に固定される",
  includes(target, "const HOME_RECENT_HISTORY_LIMIT = 7;"),
  "ホーム画面の直近履歴件数が 7 件に設定されていません",
);

check(
  "HRH-03",
  "ホーム画面が useHistoryList / cursor / AutoLoadTrigger に依存しない",
  noIncludes(target, 'import { useHistoryList } from "@/api/hooks/history";') &&
    noIncludes(target, "cursor") &&
    noIncludes(target, "AutoLoadTrigger"),
  "旧来の cursor ベース実装または AutoLoadTrigger が残っています",
);

check(
  "HRH-04",
  "package.json に専用テストスクリプトが追加され CI から呼び出される",
  includes(packageJson, '"test:home-recent-histories-hook": "node scripts/check-home-recent-histories-hook-spec.mjs"') &&
    includes(ciYaml, "pnpm --filter web test:home-recent-histories-hook"),
  "専用テストスクリプトまたは CI 適用が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
