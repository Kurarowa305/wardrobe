import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const inputTarget = path.join(webRoot, "src/components/ui/input.tsx");
const packageTarget = path.join(webRoot, "package.json");
const ciTarget = path.join(repoRoot, ".github/workflows/ci.yml");

const inputSource = fs.readFileSync(inputTarget, "utf8");
const packageSource = fs.readFileSync(packageTarget, "utf8");
const ciSource = fs.readFileSync(ciTarget, "utf8");

const checks = [
  {
    name: "Input コンポーネントが text-base を使い、モバイル入力時の自動ズームを避ける",
    ok:
      inputSource.includes('data-slot="input"') &&
      inputSource.includes("text-base text-slate-900") &&
      !inputSource.includes("text-sm text-slate-900"),
    detail:
      "src/components/ui/input.tsx の文字サイズが 16px 未満のままで、自動ズーム回避条件を満たしていません",
  },
  {
    name: "入力ズーム防止用テストスクリプトが package.json に登録されている",
    ok: packageSource.includes('"test:input-focus-zoom": "node scripts/check-input-focus-zoom-spec.mjs"'),
    detail: "apps/web/package.json に test:input-focus-zoom が追加されていません",
  },
  {
    name: "入力ズーム防止用テストが CI に追加されている",
    ok:
      ciSource.includes("Input focus zoom spec test") &&
      ciSource.includes("pnpm --filter web test:input-focus-zoom"),
    detail: ".github/workflows/ci.yml に input-focus-zoom テスト実行が追加されていません",
  },
];

let hasFailure = false;

for (const check of checks) {
  if (check.ok) {
    console.log(`✅ ${check.name}`);
  } else {
    hasFailure = true;
    console.error(`❌ ${check.name}`);
    console.error(`   ${check.detail}`);
  }
}

if (hasFailure) {
  process.exit(1);
}
