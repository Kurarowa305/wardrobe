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
  "TBI-01",
  "TabBar が4タブそれぞれにアイコンコンポーネントを設定している",
  includes("src/components/app/navigation/TabBar.tsx", "function HomeIcon()") &&
    includes("src/components/app/navigation/TabBar.tsx", "function ClockIcon()") &&
    includes("src/components/app/navigation/TabBar.tsx", "function LayersIcon()") &&
    includes("src/components/app/navigation/TabBar.tsx", "function TShirtIcon()") &&
    includes("src/components/app/navigation/TabBar.tsx", 'icon: <HomeIcon />') &&
    includes("src/components/app/navigation/TabBar.tsx", 'icon: <ClockIcon />') &&
    includes("src/components/app/navigation/TabBar.tsx", 'icon: <LayersIcon />') &&
    includes("src/components/app/navigation/TabBar.tsx", 'icon: <TShirtIcon />'),
  "TabBar.tsx に各タブ用アイコンの定義または割り当てが不足しています",
);

check(
  "TBI-02",
  "TabBar がアイコンを文言の上に描画し、アクティブ状態を aria-current で示す",
  includes("src/components/app/navigation/TabBar.tsx", 'aria-current={isActive ? "page" : undefined}') &&
    includes("src/components/app/navigation/TabBar.tsx", '<span className="tab-item-icon">{item.icon}</span>') &&
    includes("src/components/app/navigation/TabBar.tsx", '<span className="tab-item-label">{item.label}</span>'),
  "アイコンの縦積み表示または aria-current によるアクティブ状態表現が不足しています",
);

check(
  "TBI-03",
  "TabBar のアイコンと文言が通常時・アクティブ時で同じ色ルールに連動する",
  includes("src/app/globals.css", ".tab-item {") &&
    includes("src/app/globals.css", "flex-direction: column;") &&
    includes("src/app/globals.css", "gap: 4px;") &&
    includes("src/app/globals.css", ".tab-item-icon {") &&
    includes("src/app/globals.css", "color: currentColor;") &&
    includes("src/app/globals.css", ".tab-item.is-active {") &&
    includes("src/app/globals.css", "background: transparent;") &&
    includes("src/app/globals.css", "color: var(--primary-soft);"),
  "globals.css にアイコン縦積みまたは currentColor を用いたアクティブ連動スタイルが不足しています",
);

check(
  "TBI-04",
  "タブバーアイコン検証スクリプトが package.json と CI に組み込まれている",
  includes("package.json", '"test:tab-bar-icon": "node scripts/check-tab-bar-icon-spec.mjs"') &&
    includes("../../.github/workflows/ci.yml", "Tab bar icon spec test") &&
    includes("../../.github/workflows/ci.yml", "pnpm --filter web test:tab-bar-icon"),
  "package.json または CI にタブバーアイコン検証の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
