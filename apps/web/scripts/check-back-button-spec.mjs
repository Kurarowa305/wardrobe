import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const cssSource = fs.readFileSync(path.join(webRoot, "src/app/globals.css"), "utf8");
const stringsSource = fs.readFileSync(path.join(webRoot, "src/constants/navigationStrings.ts"), "utf8");
const componentSource = fs.readFileSync(path.join(webRoot, "src/components/app/navigation/BackButton.tsx"), "utf8");
const packageSource = fs.readFileSync(path.join(webRoot, "package.json"), "utf8");
const ciSource = fs.readFileSync(path.join(repoRoot, ".github/workflows/ci.yml"), "utf8");

const failures = [];
let checkCount = 0;

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }

  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "BB-01",
  "戻るボタン文言が『< 戻る』に更新されている",
  stringsSource.includes('back: "< 戻る"'),
  "navigationStrings.ts の back 文言更新が不足しています",
);

check(
  "BB-02",
  "BackButton が文言表示専用で className nav-back-button を維持している",
  componentSource.includes('<Link href={href} className="nav-back-button">') && componentSource.includes('{label}'),
  "BackButton.tsx のリンク構造が想定と異なります",
);

check(
  "BB-03",
  "戻るボタンの外枠削除・15px 指定が styles に反映されている",
  cssSource.includes('.nav-back-button {') &&
    cssSource.includes('border: 0;') &&
    cssSource.includes('background: transparent;') &&
    cssSource.includes('padding: 0;') &&
    cssSource.includes('font-size: 15px;'),
  "globals.css に戻るボタンのスタイル変更が不足しています",
);

check(
  "BB-04",
  "戻るボタン検証スクリプトが package.json と CI に登録されている",
  packageSource.includes('"test:back-button": "node scripts/check-back-button-spec.mjs"') &&
    ciSource.includes('pnpm --filter web test:back-button'),
  "package.json または CI workflow に back-button テスト登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
