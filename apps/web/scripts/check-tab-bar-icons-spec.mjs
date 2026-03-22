import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const includes = (relativePath, text) => read(relativePath).includes(text);
const includesAll = (relativePath, texts) => texts.every((text) => includes(relativePath, text));
const notExists = (relativePath) => !fs.existsSync(path.join(repoRoot, relativePath));
const tabBarIconSource = read("src/components/app/navigation/TabBarIcon.tsx");


const checks = [
  {
    name: "TabBar が SVG アイコンコンポーネントを利用する",
    ok: includesAll("src/components/app/navigation/TabBar.tsx", [
      'import { TabBarIcon } from "./TabBarIcon";',
      'const isActive = activeTab === item.key;',
      '<TabBarIcon icon={item.key} active={isActive} className="tab-item-icon" />',
      '<span>{item.label}</span>',
    ]),
    detail: "TabBar.tsx の SVG アイコン利用または文言上部配置が不足しています",
  },
  {
    name: "TabBarIcon が4タブ分の再利用可能な SVG 定義を持つ",
    ok: includesAll("src/components/app/navigation/TabBarIcon.tsx", [
      'export type TabIconKey = "home" | "histories" | "templates" | "clothings";',
      'function HomeIcon(',
      'function HistoriesIcon(',
      'function TemplatesIcon(',
      'function ClothingsIcon(',
      'return <ClothingsIcon active={active} {...props} />;',
    ]),
    detail: "TabBarIcon.tsx に4タブ分の SVG 定義が不足しています",
  },
  {
    name: "ホーム / テンプレート / 履歴アイコンが最新仕様の輪郭線に更新されている",
    ok:
      includesAll("src/components/app/navigation/TabBarIcon.tsx", [
        '      <path d="M4.5 10.5 12 4l7.5 6.5" fill="none" />',
        '      <path d="M6.5 9.5V20h11V9.5" fill="none" />',
        '      <rect x="6" y="7" width="10.5" height="10.5" rx="1.8" fill="none" />',
        '      <rect x="9" y="4.5" width="9" height="9" rx="1.6" fill="none" />',
        '      <path d="M4.7 4.8v4.1h3.5" fill="none" />',
      ]) &&
      !tabBarIconSource.includes('      <rect x="9.1" y="11.2" width="2.8" height="6.8" rx="0.6" stroke="none" />') &&
      !tabBarIconSource.includes('      <rect x="12.9" y="11.2" width="2.8" height="6.8" rx="0.6" stroke="none" />'),
    detail: "ホーム / テンプレート / 履歴アイコンの SVG パスが最新仕様に更新されていません",
  },
  {
    name: "旧 PNG アイコン画像が削除されている",
    ok:
      notExists("public/icons/home_active.png") &&
      notExists("public/icons/home_inactive.png") &&
      notExists("public/icons/history_active.png") &&
      notExists("public/icons/history_inactive.png") &&
      notExists("public/icons/template_active.png") &&
      notExists("public/icons/template_inactive.png") &&
      notExists("public/icons/cloth_active.png") &&
      notExists("public/icons/cloth_inactive.png"),
    detail: "public/icons 配下に旧 PNG アイコン画像が残っています",
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
