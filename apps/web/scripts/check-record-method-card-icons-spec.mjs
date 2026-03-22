import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const screenTarget = path.join(repoRoot, "src/components/app/screens/RecordMethodScreen.tsx");
const iconTarget = path.join(repoRoot, "src/components/app/navigation/TabBarIcon.tsx");
const cssTarget = path.join(repoRoot, "src/app/globals.css");
const packageTarget = path.join(repoRoot, "package.json");
const ciTarget = path.join(repoRoot, "../../.github/workflows/ci.yml");

const screenSource = fs.readFileSync(screenTarget, "utf8");
const iconSource = fs.readFileSync(iconTarget, "utf8");
const cssSource = fs.readFileSync(cssTarget, "utf8");
const packageSource = fs.readFileSync(packageTarget, "utf8");
const ciSource = fs.readFileSync(ciTarget, "utf8");

const checks = [
  {
    id: "RMI-01",
    name: "記録方法選択画面がタブバーと同一のアイコンコンポーネントを利用する",
    passed:
      screenSource.includes('import { TabBarIcon } from "@/components/app/navigation/TabBarIcon";') &&
      screenSource.includes('<TabBarIcon icon="templates"') &&
      screenSource.includes('<TabBarIcon icon="clothings"'),
  },
  {
    id: "RMI-02",
    name: "各カードの右側に黒線アイコンを配置する",
    passed:
      screenSource.includes('strokeColor="#000000" className="record-method-card-icon"') &&
      screenSource.includes('className="record-method-card"'),
  },
  {
    id: "RMI-03",
    name: "TabBarIcon が任意の線色上書きを受け付ける",
    passed:
      iconSource.includes("strokeColor?: string;") &&
      iconSource.includes('const color = strokeColor ?? (active ? "#FFFFFF" : "#6B7987");'),
  },
  {
    id: "RMI-04",
    name: "記録方法選択カードの左右配置スタイルが定義される",
    passed:
      cssSource.includes(".record-method-card {") &&
      cssSource.includes("justify-content: space-between;") &&
      cssSource.includes(".record-method-card-icon {") &&
      cssSource.includes("flex-shrink: 0;"),
  },
  {
    id: "RMI-05",
    name: "検証スクリプトが package.json と CI に登録される",
    passed:
      packageSource.includes('"test:record-method-card-icons": "node scripts/check-record-method-card-icons-spec.mjs"') &&
      ciSource.includes("pnpm --filter web test:record-method-card-icons"),
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
