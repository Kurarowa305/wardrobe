import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const cssSource = fs.readFileSync(path.join(webRoot, "src/app/globals.css"), "utf8");
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
  "OMT-01",
  "縦三点リーダーのトリガー外枠が非表示化されている",
  cssSource.includes(".overflow-menu-trigger {") &&
    cssSource.includes("border: 0;") &&
    cssSource.includes("border-radius: 0;") &&
    cssSource.includes("background: transparent;"),
  "overflow-menu-trigger に border/background の外枠削除指定が不足しています",
);

check(
  "OMT-02",
  "外枠削除の検証スクリプトが package.json と CI に登録されている",
  packageSource.includes('"test:overflow-menu-trigger": "node scripts/check-overflow-menu-trigger-spec.mjs"') &&
    ciSource.includes("pnpm --filter web test:overflow-menu-trigger"),
  "package.json または CI workflow に overflow-menu-trigger テスト登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
