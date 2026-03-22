import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;

const abs = (relPath) => path.join(webRoot, relPath);
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const exists = (relPath) => fs.existsSync(abs(relPath));
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

check("CLGI-01", "服一覧カードの共通セクション実装が存在する", exists(target), `${target} が存在しません`);
check(
  "CLGI-02",
  "非選択時の一覧カードは右端列を持たない2カラム構成である",
  includes(target, 'selectable ? "grid-cols-[56px_minmax(0,1fr)_40px]" : "grid-cols-[56px_minmax(0,1fr)]"'),
  "非選択時のカードレイアウトが2カラム化されていません",
);
check(
  "CLGI-03",
  "一覧カード右端のジャンルアイコンは選択UI時にのみ表示領域を持つ",
  includes(target, '{selectable ? (') && excludes(target, '<ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-400" />'),
  "非選択カードにジャンルアイコン描画が残っています",
);
check(
  "CLGI-04",
  "セクション見出しのジャンルアイコンは維持される",
  includes(target, '<ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-700" />'),
  "セクション見出しのジャンルアイコンまで削除されています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
