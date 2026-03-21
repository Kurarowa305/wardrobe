import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const webRoot = repoRoot;

const screenFiles = [
  "src/components/app/screens/WardrobeCreateScreen.tsx",
  "src/components/app/screens/HomeTabScreen.tsx",
  "src/components/app/screens/HistoriesTabScreen.tsx",
  "src/components/app/screens/TemplatesTabScreen.tsx",
  "src/components/app/screens/ClothingsTabScreen.tsx",
  "src/components/app/screens/RecordMethodScreen.tsx",
  "src/components/app/screens/RecordByTemplateScreen.tsx",
  "src/components/app/screens/RecordByCombinationScreen.tsx",
  "src/components/app/screens/TemplateCreateScreen.tsx",
  "src/components/app/screens/TemplateDetailScreen.tsx",
  "src/components/app/screens/TemplateEditScreen.tsx",
  "src/components/app/screens/ClothingCreateScreen.tsx",
  "src/components/app/screens/ClothingDetailScreen.tsx",
  "src/components/app/screens/ClothingEditScreen.tsx",
  "src/components/app/screens/HistoryDetailScreen.tsx",
];

const checks = [
  {
    id: "SCR-01",
    name: "ScreenPrimitives.tsx が削除されている",
    ok: !fs.existsSync(path.join(webRoot, "src/components/app/screens/ScreenPrimitives.tsx")),
    detail: "ScreenCard 実装ファイルが残っています",
  },
  {
    id: "SCR-02",
    name: "対象全画面から ScreenCard / ScreenTextCard の参照が除去されている",
    ok: screenFiles.every((file) => {
      const source = fs.readFileSync(path.join(webRoot, file), "utf8");
      return !source.includes("ScreenCard") && !source.includes("ScreenTextCard") && !source.includes("ScreenPrimitives");
    }),
    detail: "いずれかの画面に ScreenCard 系参照が残っています",
  },
  {
    id: "SCR-03",
    name: "直接描画へ移行した主要画面に grid ラッパーがある",
    ok: [
      "src/components/app/screens/RecordByTemplateScreen.tsx",
      "src/components/app/screens/TemplateDetailScreen.tsx",
      "src/components/app/screens/ClothingDetailScreen.tsx",
      "src/components/app/screens/HistoryDetailScreen.tsx",
    ].every((file) => fs.readFileSync(path.join(webRoot, file), "utf8").includes('className="grid gap-4"')),
    detail: "直接描画用の外側ラッパーが不足している画面があります",
  },
];

let hasFailure = false;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS ${check.id}: ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`FAIL ${check.id}: ${check.name}`);
    console.error(`  ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
