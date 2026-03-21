import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function abs(relPath) {
  return path.join(webRoot, relPath);
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
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

const historyTarget = "src/components/app/screens/HistoriesTabScreen.tsx";
const templateTarget = "src/components/app/screens/TemplatesTabScreen.tsx";
const clothingTarget = "src/components/app/screens/ClothingsTabScreen.tsx";

check(
  "LSS-01",
  "履歴一覧画面の『さらに読み込む』ボタンに上余白が設定されている",
  includes(historyTarget, 'className="mt-4 w-full text-sm font-medium"'),
  "HistoriesTabScreen の load more ボタンに mt-4 が設定されていません",
);

check(
  "LSS-02",
  "テンプレート一覧画面の『＋ テンプレートを追加』ボタンに下余白が設定されている",
  includes(templateTarget, 'className="mb-4 w-full justify-start text-left text-base font-bold text-white"'),
  "TemplatesTabScreen の add ボタンに mb-4 が設定されていません",
);

check(
  "LSS-03",
  "テンプレート一覧画面の『さらに読み込む』ボタンに上余白が設定されている",
  includes(templateTarget, 'className="mt-4 w-full text-sm font-medium"'),
  "TemplatesTabScreen の load more ボタンに mt-4 が設定されていません",
);

check(
  "LSS-04",
  "服一覧画面の『＋ 服を追加』ボタンに下余白が設定されている",
  includes(clothingTarget, 'className="mb-4 w-full justify-start text-left text-base font-bold text-white"'),
  "ClothingsTabScreen の add ボタンに mb-4 が設定されていません",
);

check(
  "LSS-05",
  "服一覧画面の『さらに読み込む』ボタンに上余白が設定されている",
  includes(clothingTarget, 'className="mt-4 w-full text-sm font-medium"'),
  "ClothingsTabScreen の load more ボタンに mt-4 が設定されていません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
