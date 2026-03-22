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

const inputTarget = "src/components/ui/input.tsx";
const styleTarget = "src/app/globals.css";
const templateScreenTarget = "src/components/app/screens/RecordByTemplateScreen.tsx";
const combinationScreenTarget = "src/components/app/screens/RecordByCombinationScreen.tsx";

check(
  "RDIS-01",
  "Input 基盤が date input を判定して専用クラスを付与する",
  () =>
    includes(inputTarget, 'const isDateInput = type === "date";') &&
    includes(inputTarget, 'isDateInput && "date-input px-3 pr-3"'),
  "date input 判定または専用クラス付与が Input 基盤に実装されていません",
);

check(
  "RDIS-02",
  "date input のカレンダーアイコン右余白を globals.css で確保する",
  () =>
    includes(styleTarget, ".date-input::-webkit-calendar-picker-indicator") &&
    includes(styleTarget, "margin-right: 12px;") &&
    includes(styleTarget, ".date-input::-webkit-datetime-edit") &&
    includes(styleTarget, "padding-inline-end: 12px;"),
  "date input の右余白用スタイルが globals.css に定義されていません",
);

check(
  "RDIS-03",
  "記録画面 2 画面が共通 Input 基盤の date input を利用する",
  () =>
    includes(templateScreenTarget, 'type="date"') &&
    includes(templateScreenTarget, '<Input') &&
    includes(combinationScreenTarget, 'type="date"') &&
    includes(combinationScreenTarget, '<Input'),
  "記録画面の date input が共通 Input 基盤経由で利用されていません",
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
  console.log("\nRecord date input spacing spec checks passed.");
}
