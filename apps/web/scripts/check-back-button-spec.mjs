import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const getBackButtonBlock = () => {
  const source = read("src/app/globals.css");
  const start = source.indexOf(".nav-back-button {");
  if (start === -1) return "";
  const end = source.indexOf("}\n", start);
  return end === -1 ? source.slice(start) : source.slice(start, end);
};

const checks = [
  {
    id: "BB-01",
    name: "戻る文言が `< 戻る` に更新されている",
    ok: includes("src/constants/navigationStrings.ts", 'back: "< 戻る"'),
    detail: "navigationStrings.ts の戻る文言が `< 戻る` になっていません",
  },
  {
    id: "BB-02",
    name: "Header が共通戻る文言を BackButton に渡している",
    ok: includes("src/components/app/navigation/Header.tsx", '<BackButton href={backHref} label={NAVIGATION_STRINGS.back} />'),
    detail: "Header.tsx が共通戻る文言を参照していません",
  },
  {
    id: "BB-03",
    name: "戻るボタンのスタイルが外枠なしのテキスト導線に更新されている",
    ok:
      includes("src/app/globals.css", ".nav-back-button {") &&
      includes("src/app/globals.css", "justify-content: flex-start;") &&
      includes("src/app/globals.css", "padding: 0;") &&
      includes("src/app/globals.css", "border: 0;") &&
      includes("src/app/globals.css", "background: transparent;"),
    detail: "globals.css に戻るボタンの新スタイルが不足しています",
  },
  {
    id: "BB-04",
    name: "戻るボタンに旧ボタン外枠スタイルが残っていない",
    ok: (() => {
      const block = getBackButtonBlock();
      return (
        !block.includes("min-width: 56px;") &&
        !block.includes("border-radius: 999px;") &&
        !block.includes("border: 1px solid var(--line);") &&
        !block.includes("background: #fff;")
      );
    })(),
    detail: "globals.css に旧戻るボタンスタイルが残っています",
  },
  {
    id: "BB-05",
    name: "戻るボタン検証スクリプトが package.json と CI に登録されている",
    ok:
      includes("package.json", '"test:back-button": "node scripts/check-back-button-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:back-button"),
    detail: "package.json または CI に戻るボタン検証が登録されていません",
  },
];

let hasFailure = false;

for (const check of checks) {
  if (check.ok) {
    console.log(`✅ ${check.id}: ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`❌ ${check.id}: ${check.name}`);
    console.error(`   ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
