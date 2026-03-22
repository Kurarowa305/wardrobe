import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const overflowMenuTarget = path.join(repoRoot, "src/components/app/navigation/OverflowMenu.tsx");
const clothingDetailTarget = path.join(repoRoot, "src/components/app/screens/ClothingDetailScreen.tsx");
const templateDetailTarget = path.join(repoRoot, "src/components/app/screens/TemplateDetailScreen.tsx");
const historyDetailTarget = path.join(repoRoot, "src/components/app/screens/HistoryDetailScreen.tsx");
const cssTarget = path.join(repoRoot, "src/app/globals.css");
const packageTarget = path.join(repoRoot, "package.json");
const ciTarget = path.join(repoRoot, "../../.github/workflows/ci.yml");

const overflowMenuSource = fs.readFileSync(overflowMenuTarget, "utf8");
const clothingDetailSource = fs.readFileSync(clothingDetailTarget, "utf8");
const templateDetailSource = fs.readFileSync(templateDetailTarget, "utf8");
const historyDetailSource = fs.readFileSync(historyDetailTarget, "utf8");
const cssSource = fs.readFileSync(cssTarget, "utf8");
const packageSource = fs.readFileSync(packageTarget, "utf8");
const ciSource = fs.readFileSync(ciTarget, "utf8");

const checks = [
  {
    id: "OMI-01",
    name: "OverflowMenu が編集・削除アイコン SVG を内包し、ラベル右側に描画する",
    passed:
      overflowMenuSource.includes('icon: "edit" | "delete";') &&
      overflowMenuSource.includes('d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"') &&
      overflowMenuSource.includes('d="M3 6h18"') &&
      overflowMenuSource.includes("<span>{action.label}</span>") &&
      overflowMenuSource.includes('<OverflowMenuItemIcon icon={action.icon} />'),
  },
  {
    id: "OMI-02",
    name: "各詳細画面のメニューアクションがアイコン種別を指定する",
    passed:
      clothingDetailSource.includes('icon: "edit"') &&
      clothingDetailSource.includes('icon: "delete"') &&
      templateDetailSource.includes('icon: "edit"') &&
      templateDetailSource.includes('icon: "delete"') &&
      historyDetailSource.includes('icon: "delete"'),
  },
  {
    id: "OMI-03",
    name: "削除アクションに danger tone を指定し、赤色スタイルが定義される",
    passed:
      clothingDetailSource.includes('tone: "danger"') &&
      templateDetailSource.includes('tone: "danger"') &&
      historyDetailSource.includes('tone: "danger"') &&
      cssSource.includes(".overflow-menu-item-danger {") &&
      cssSource.includes("color: #b91c1c;") &&
      cssSource.includes("justify-content: space-between;"),
  },
  {
    id: "OMI-04",
    name: "検証スクリプトが package.json と CI に登録される",
    passed:
      packageSource.includes('"test:overflow-menu-icons": "node scripts/check-overflow-menu-icon-spec.mjs"') &&
      ciSource.includes("pnpm --filter web test:overflow-menu-icons"),
  },
];

let failed = false;
for (const check of checks) {
  if (check.passed) {
    console.log(`✅ ${check.id}: ${check.name}`);
  } else {
    failed = true;
    console.error(`❌ ${check.id}: ${check.name}`);
  }
}

if (failed) {
  process.exit(1);
}
