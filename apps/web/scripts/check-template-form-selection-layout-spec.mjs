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

function excludes(relPath, expected) {
  return !includes(relPath, expected);
}

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }

  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const target = "src/components/app/screens/TemplateForm.tsx";

check(
  "TFL-01",
  "テンプレートフォームの服選択は外側カードを廃してプレーンな fieldset レイアウトになっている",
  includes(target, 'className="grid gap-3 border-0 p-0"') &&
    includes(target, 'className="px-0 text-sm font-medium text-slate-900"') &&
    excludes(target, 'rounded-md border border-slate-200 p-3'),
  "服選択セクションに旧カード風レイアウトが残っています",
);

check(
  "TFL-02",
  "各服カードにアイコン付きの3カラム選択レイアウトを使っている",
  includes(target, 'import { TabBarIcon } from "@/components/ui/tab-bar-icon";') &&
    includes(target, 'grid-cols-[28px_minmax(0,1fr)_40px]') &&
    includes(target, '<TabBarIcon icon="clothings" active={false}') &&
    includes(target, 'className="sr-only"'),
  "アイコン付き選択カードの実装が不足しています",
);

check(
  "TFL-03",
  "右側に独立したチェック領域を設け、選択時はアクセントカラーで表示する",
  includes(target, 'className="flex justify-end"') &&
    includes(target, 'border-[var(--primary)] bg-[var(--primary)] text-white') &&
    includes(target, 'border-slate-300 bg-white text-transparent') &&
    includes(target, '✓'),
  "右側チェック領域またはアクセントカラー反映が不足しています",
);

check(
  "TFL-04",
  "追加・保存ボタンは画面下部固定で、フォーム末尾に余白を確保している",
  includes(target, 'className="grid gap-3 pb-24"') &&
    includes(target, 'className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"') &&
    includes(target, 'className="w-full text-sm font-medium"'),
  "固定フッターボタンまたは下部余白が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
