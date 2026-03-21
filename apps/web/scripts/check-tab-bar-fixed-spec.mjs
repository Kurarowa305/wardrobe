import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
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

check(
  "TBF-01",
  "TabBar が画面下部固定表示のスタイルを持つ",
  includes("src/app/globals.css", ".tab-bar {") &&
    includes("src/app/globals.css", "position: fixed;") &&
    includes("src/app/globals.css", "bottom: 0;") &&
    includes("src/app/globals.css", "left: 50%;") &&
    includes("src/app/globals.css", "transform: translateX(-50%);") &&
    includes("src/app/globals.css", "width: min(100%, 420px);") &&
    includes("src/app/globals.css", "padding-bottom: env(safe-area-inset-bottom);") &&
    includes("src/app/globals.css", "z-index: 20;"),
  "globals.css の tab-bar スタイルが固定下部表示仕様と一致しません",
);

check(
  "TBF-02",
  "AppLayout の本文に固定 TabBar 分の下余白がある",
  includes("src/app/globals.css", ".app-content {") &&
    includes("src/app/globals.css", "padding: 16px 16px calc(16px + 56px + env(safe-area-inset-bottom));"),
  "固定 TabBar と本文が重ならないための下余白が app-content に設定されていません",
);

check(
  "TBF-03",
  "固定 TabBar の検証スクリプトが package.json と CI に組み込まれている",
  includes("package.json", '"test:tab-bar-fixed": "node scripts/check-tab-bar-fixed-spec.mjs"') &&
    includes("../../.github/workflows/ci.yml", "Tab bar fixed spec test") &&
    includes("../../.github/workflows/ci.yml", "pnpm --filter web test:tab-bar-fixed"),
  "package.json または CI に固定 TabBar テストの定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
