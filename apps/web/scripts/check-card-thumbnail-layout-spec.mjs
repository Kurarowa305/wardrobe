import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function includes(relativePath, snippet) {
  return read(relativePath).includes(snippet);
}

const results = [];

function check(id, description, predicate, failureDetail) {
  try {
    const passed = Boolean(predicate());
    results.push({ id, description, passed, detail: passed ? "ok" : failureDetail });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ id, description, passed: false, detail: `unexpected error: ${message}` });
  }
}

const historyTarget = "src/components/app/history/HistoryCard.tsx";
const templatesTarget = "src/components/app/screens/TemplatesTabScreen.tsx";
const recordTarget = "src/components/app/screens/RecordByTemplateScreen.tsx";

check(
  "CTL-01",
  "履歴カードが5列グリッドでサムネイルと+x枠を1行に固定する",
  () =>
    includes(historyTarget, 'const HISTORY_THUMBNAIL_GRID_CLASS = "grid grid-cols-5 gap-2";') &&
    includes(historyTarget, 'className={HISTORY_THUMBNAIL_GRID_CLASS}') &&
    includes(
      historyTarget,
      'className="relative block aspect-square w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"',
    ) &&
    includes(
      historyTarget,
      'className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700"',
    ),
  "履歴カードで5列固定グリッドまたは正方形サムネイル指定が不足しています",
);

check(
  "CTL-02",
  "テンプレート一覧カードが履歴カードと同じ5列グリッドレイアウトを採用する",
  () =>
    includes(templatesTarget, 'const TEMPLATE_THUMBNAIL_GRID_CLASS = "grid grid-cols-5 gap-2";') &&
    includes(templatesTarget, 'className={TEMPLATE_THUMBNAIL_GRID_CLASS}') &&
    includes(
      templatesTarget,
      'className="relative block aspect-square w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"',
    ) &&
    includes(
      templatesTarget,
      'className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700"',
    ),
  "テンプレート一覧カードの5列固定グリッド指定が不足しています",
);

check(
  "CTL-03",
  "テンプレート記録カードも5列グリッドで統一し、選択UIと共存する",
  () =>
    includes(recordTarget, 'const TEMPLATE_THUMBNAIL_GRID_CLASS = "grid grid-cols-5 gap-2";') &&
    includes(recordTarget, 'className={TEMPLATE_THUMBNAIL_GRID_CLASS}') &&
    includes(
      recordTarget,
      'className="relative block aspect-square w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"',
    ) &&
    includes(
      recordTarget,
      'className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700"',
    ) &&
    includes(recordTarget, 'grid-cols-[minmax(0,1fr)_40px]'),
  "テンプレート記録カードの5列固定グリッド指定または選択UI共存実装が不足しています",
);

let hasFailure = false;
for (const result of results) {
  const icon = result.passed ? "✅" : "❌";
  console.log(`${icon} ${result.id}: ${result.description}`);
  if (!result.passed) {
    console.log(`   ${result.detail}`);
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log("\nCard thumbnail layout checks passed.");
}
