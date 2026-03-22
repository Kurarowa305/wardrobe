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

const templateScreen = "src/components/app/screens/RecordByTemplateScreen.tsx";
const combinationScreen = "src/components/app/screens/RecordByCombinationScreen.tsx";
const expectedClassName = 'className="date-input-balanced pr-3 [&::-webkit-calendar-picker-indicator]:ml-3"';

check(
  "RDIS-01",
  "テンプレート記録画面の日付入力欄が右側に左側と同等の余白を持つ",
  () => includes(templateScreen, expectedClassName),
  "テンプレート記録画面の日付入力欄に右余白調整クラスがありません",
);

check(
  "RDIS-02",
  "服組み合わせ記録画面の日付入力欄が右側に左側と同等の余白を持つ",
  () => includes(combinationScreen, expectedClassName),
  "服組み合わせ記録画面の日付入力欄に右余白調整クラスがありません",
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
