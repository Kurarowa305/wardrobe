import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesAll = (relativePath, texts) => texts.every((text) => includes(relativePath, text));

const checks = [
  {
    name: "TabBar が各タブの active / inactive アイコン定義を持つ",
    ok: includesAll("src/components/app/navigation/TabBar.tsx", [
      'activeIconSrc: "/icons/home_active.png"',
      'inactiveIconSrc: "/icons/home_inactive.png"',
      'activeIconSrc: "/icons/history_active.png"',
      'inactiveIconSrc: "/icons/history_inactive.png"',
      'activeIconSrc: "/icons/template_active.png"',
      'inactiveIconSrc: "/icons/template_inactive.png"',
      'activeIconSrc: "/icons/cloth_active.png"',
      'inactiveIconSrc: "/icons/cloth_inactive.png"',
    ]),
    detail: "TabBar.tsx に各タブ用アイコン定義が不足しています",
  },
  {
    name: "TabBar がアクティブ状態に応じてアイコン画像を切り替える",
    ok: includesAll("src/components/app/navigation/TabBar.tsx", [
      'const isActive = activeTab === item.key;',
      'src={isActive ? item.activeIconSrc : item.inactiveIconSrc}',
      'className="tab-item-icon"',
      '<span>{item.label}</span>',
    ]),
    detail: "TabBar.tsx の active / inactive 切り替え、または文言上部アイコン配置が不足しています",
  },
  {
    name: "TabBar のスタイルが縦並びアイコン付きレイアウトに更新されている",
    ok: includesAll("src/app/globals.css", [
      '.tab-item {',
      'flex-direction: column;',
      'gap: 4px;',
      '.tab-item-icon {',
      'width: 24px;',
      'height: 24px;',
    ]),
    detail: "globals.css にタブアイコン用の縦並びスタイルが不足しています",
  },
  {
    name: "タブバーアイコン検証スクリプトが package.json と CI に組み込まれている",
    ok:
      includes("package.json", '"test:tab-bar-icons": "node scripts/check-tab-bar-icons-spec.mjs"') &&
      includes("../../.github/workflows/ci.yml", "pnpm --filter web test:tab-bar-icons"),
    detail: "package.json または CI にタブバーアイコン検証が登録されていません",
  },
];

let hasFailure = false;

for (const check of checks) {
  if (check.ok) {
    console.log(`✅ ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`❌ ${check.name}`);
    console.error(`   ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
