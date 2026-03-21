import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

const SCREEN_FILES = [
  "src/components/app/screens/ClothingCreateScreen.tsx",
  "src/components/app/screens/ClothingEditScreen.tsx",
  "src/components/app/screens/RecordByTemplateScreen.tsx",
  "src/components/app/screens/TemplateCreateScreen.tsx",
  "src/components/app/screens/TemplateEditScreen.tsx",
  "src/components/app/screens/ClothingDetailScreen.tsx",
  "src/components/app/screens/HistoryDetailScreen.tsx",
  "src/components/app/screens/TemplateDetailScreen.tsx",
];

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
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
  "SCR-01",
  "ScreenPrimitives から ScreenCard 実装が削除されている",
  !read("src/components/app/screens/ScreenPrimitives.tsx").includes(
    "export function ScreenCard",
  ) &&
    !read("src/components/app/screens/ScreenPrimitives.tsx").includes(
      "type ScreenCardProps",
    ),
  "ScreenPrimitives.tsx に ScreenCard 実装が残っています",
);

check(
  "SCR-02",
  "ScreenCard を利用していた画面が直接描画へ移行している",
  SCREEN_FILES.every((file) => {
    const source = read(file);
    return (
      !source.includes("ScreenCard") &&
      source.includes(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
      )
    );
  }),
  "直接描画ラッパーへの置換が不足している画面があります",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
