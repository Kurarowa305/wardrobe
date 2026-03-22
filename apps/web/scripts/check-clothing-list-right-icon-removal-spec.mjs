import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;

const abs = (relPath) => path.join(webRoot, relPath);
const exists = (relPath) => fs.existsSync(abs(relPath));
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
const excludes = (relPath, expected) => !read(relPath).includes(expected);

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const target = "src/components/app/screens/ClothingGenreSection.tsx";

check("CLRI-01", "服一覧カード実装ファイルが存在する", exists(target), `${target} が存在しません`);
check(
  "CLRI-02",
  "通常の服一覧カードが右アイコンなしの2カラムレイアウトを使う",
  includes(target, 'selectable ? "grid-cols-[56px_minmax(0,1fr)_40px]" : "grid-cols-[56px_minmax(0,1fr)]"'),
  "非選択カード用の2カラムレイアウト切り替えが不足しています",
);
check(
  "CLRI-03",
  "通常の服一覧カードは右端アイコンを描画しない",
  excludes(target, '<ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-400" />'),
  "非選択カードの右アイコン描画が残っています",
);
check(
  "CLRI-04",
  "選択式カードのチェックマークUIは維持する",
  includes(target, 'selectable ? (') && includes(target, '✓') && includes(target, 'grid-cols-[56px_minmax(0,1fr)_40px]'),
  "選択式カード向けチェックUIが失われています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
