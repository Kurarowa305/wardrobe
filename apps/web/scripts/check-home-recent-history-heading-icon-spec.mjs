import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const screenTarget = path.join(repoRoot, "src/components/app/screens/HomeTabScreen.tsx");
const iconTarget = path.join(repoRoot, "src/components/ui/tab-bar-icon.tsx");
const packageTarget = path.join(repoRoot, "package.json");
const ciTarget = path.join(repoRoot, "../../.github/workflows/ci.yml");

const screenSource = fs.readFileSync(screenTarget, "utf8");
const iconSource = fs.readFileSync(iconTarget, "utf8");
const packageSource = fs.readFileSync(packageTarget, "utf8");
const ciSource = fs.readFileSync(ciTarget, "utf8");

const checks = [
  {
    id: "HRHI-01",
    name: "ホーム画面の『直近1週間の履歴』見出しが TabBarIcon を利用する",
    passed:
      screenSource.includes('import { TabBarIcon } from "@/components/ui/tab-bar-icon";') &&
      screenSource.includes('<TabBarIcon icon="histories" active={false} strokeColor="#000000" className="h-5 w-5" />'),
  },
  {
    id: "HRHI-02",
    name: "見出しがアイコンと文言の横並びレイアウトになる",
    passed:
      screenSource.includes('className="m-0 flex items-center gap-2 text-sm font-semibold text-slate-900"') &&
      screenSource.includes('<span>{HOME_STRINGS.sections.recentWeekHistories}</span>'),
  },
  {
    id: "HRHI-03",
    name: "TabBarIcon が黒線指定を受け付ける",
    passed:
      iconSource.includes('strokeColor?: string;') &&
      iconSource.includes('const color = strokeColor ?? (active ? "#FFFFFF" : "#6B7987");'),
  },
  {
    id: "HRHI-04",
    name: "検証スクリプトが package.json と CI に登録される",
    passed:
      packageSource.includes('"test:home-recent-history-heading-icon": "node scripts/check-home-recent-history-heading-icon-spec.mjs"') &&
      ciSource.includes('pnpm --filter web test:home-recent-history-heading-icon'),
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
