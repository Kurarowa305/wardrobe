import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

function readFromWeb(relativePath) {
  return fs.readFileSync(path.join(webRoot, relativePath), "utf8");
}

function readFromRepo(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function includesFromWeb(relativePath, snippet) {
  return readFromWeb(relativePath).includes(snippet);
}

function includesFromRepo(relativePath, snippet) {
  return readFromRepo(relativePath).includes(snippet);
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

check(
  "ACS-01",
  "共通 primary カラー変数が #687A88 に統一される",
  () =>
    includesFromWeb("src/app/globals.css", "--primary: #687A88;") &&
    includesFromWeb("src/app/globals.css", "--primary-soft: #687A881f;"),
  "globals.css の primary 系カラー変数が #687A88 に統一されていません",
);

check(
  "ACS-02",
  "デフォルトボタンがアクセントカラー #687A88 を利用する",
  () =>
    includesFromWeb("src/components/ui/button.tsx", 'default: "bg-[#687A88] text-white hover:bg-[#5c6d79]"'),
  "button.tsx の default variant が指定アクセントカラーを使っていません",
);

check(
  "ACS-03",
  "タブバーのアクティブ状態が primary 系カラー変数を利用する",
  () =>
    includesFromWeb("src/app/globals.css", ".tab-item.is-active {") &&
    includesFromWeb("src/app/globals.css", "color: var(--primary);") &&
    includesFromWeb("src/app/globals.css", "background: var(--primary-soft);") &&
    includesFromWeb("src/components/app/navigation/TabBar.tsx", 'className={`tab-item${activeTab === item.key ? " is-active" : ""}`}'),
  "タブバーのアクティブ状態が共通アクセントカラーに接続されていません",
);

check(
  "ACS-04",
  "対象画面の主要CTAが default ボタンで描画される",
  () =>
    includesFromWeb("src/components/app/screens/WardrobeCreateScreen.tsx", '<Button type="submit" className="w-full">') &&
    includesFromWeb("src/components/app/screens/HomeTabScreen.tsx", '<Button asChild className="w-full justify-start text-left text-sm font-medium">') &&
    includesFromWeb("src/components/app/screens/TemplatesTabScreen.tsx", '<Button asChild className="w-full justify-start text-left text-sm font-medium">') &&
    includesFromWeb("src/components/app/screens/ClothingsTabScreen.tsx", '<Button asChild className="w-full justify-start text-left text-sm font-medium">') &&
    includesFromWeb("src/components/app/screens/RecordByTemplateScreen.tsx", '<Button\n            type="submit"') &&
    includesFromWeb("src/components/app/screens/RecordByCombinationScreen.tsx", '<Button\n          type="submit"') &&
    includesFromWeb("src/components/app/screens/ClothingCreateScreen.tsx", '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>') &&
    includesFromWeb("src/components/app/screens/ClothingEditScreen.tsx", '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>') &&
    includesFromWeb("src/components/app/screens/TemplateForm.tsx", '<Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isSelectionEmpty || isPending}>'),
  "指定された主要CTAのいずれかが default ボタン利用になっていません",
);

check(
  "ACS-05",
  "アクセントカラーテストが package.json と CI に組み込まれる",
  () =>
    includesFromWeb("package.json", '"test:accent-color": "node scripts/check-accent-color-spec.mjs"') &&
    includesFromRepo(".github/workflows/ci.yml", "Accent color spec test") &&
    includesFromRepo(".github/workflows/ci.yml", "pnpm --filter web test:accent-color"),
  "package.json または CI に accent color spec test が組み込まれていません",
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
  console.log("\nAccent color spec checks passed.");
}
