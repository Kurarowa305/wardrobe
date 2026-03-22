import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const iconFile = path.join(repoRoot, "src/components/app/navigation/TabBarIcon.tsx");
const packageFile = path.join(repoRoot, "package.json");
const ciFile = path.join(repoRoot, "../../.github/workflows/ci.yml");

const iconSource = fs.readFileSync(iconFile, "utf8");
const packageSource = fs.readFileSync(packageFile, "utf8");
const ciSource = fs.readFileSync(ciFile, "utf8");

const checks = [
  {
    name: "ホームタブが家の輪郭とドアを線画で表現している",
    ok:
      iconSource.includes('function HomeIcon(') &&
      iconSource.includes('<path d="M5 10.5 12 4.5l7 6" />') &&
      iconSource.includes('<path d="M7 8.8V19.5H17V8.8" />') &&
      iconSource.includes('<path d="M10.2 19.5V13h3.6v6.5" />') &&
      !iconSource.includes('<rect x="9.1"') &&
      !iconSource.includes('stroke="none"'),
    detail: "HomeIcon が一筆書きの輪郭線ベースになっていません",
  },
  {
    name: "テンプレートタブが重なった二つの四角で表現されている",
    ok:
      iconSource.includes('function TemplatesIcon(') &&
      iconSource.includes('<rect x="5" y="5" width="10" height="10" rx="1.8" />') &&
      iconSource.includes('<path d="M15 9h4v10H9v-4" />') &&
      !iconSource.includes('<path d="M9 7.5h4.5"') &&
      !iconSource.includes('<path d="M16 8.5 19 6v14H8.2V18" fill="none" />'),
    detail: "TemplatesIcon が二重の四角表現になっていません",
  },
  {
    name: "タブアイコン形状テストが package.json と CI に登録されている",
    ok:
      packageSource.includes('"test:tab-bar-icon-shapes": "node scripts/check-tab-bar-icon-shapes-spec.mjs"') &&
      ciSource.includes('pnpm --filter web test:tab-bar-icon-shapes'),
    detail: "package.json または CI にタブアイコン形状テストが登録されていません",
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
