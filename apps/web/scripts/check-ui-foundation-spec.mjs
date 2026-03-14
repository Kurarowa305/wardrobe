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

function exists(relPath) {
  return fs.existsSync(abs(relPath));
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

check(
  "UF-01",
  "shadcn/ui 基盤ファイル（Button/Input/Toast）が存在する",
  [
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/toast.tsx",
    "src/components/ui/toaster.tsx",
    "src/components/ui/use-toast.ts",
    "src/lib/utils.ts",
  ].every((file) => exists(file)),
  "必要な ui 基盤ファイルが不足しています",
);

check(
  "UF-02",
  "RootLayout に Toaster が組み込まれている",
  includes("src/app/layout.tsx", 'import { Toaster } from "@/components/ui/toaster";') &&
    includes("src/app/layout.tsx", "<Toaster />"),
  "layout.tsx で Toaster の import または描画が不足しています",
);

check(
  "UF-03",
  "ワードローブ作成画面で Button と Input を利用している",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { Button } from "@/components/ui/button";') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'import { Input } from "@/components/ui/input";') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "<Input") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "<Button"),
  "WardrobeCreateScreen.tsx で Button/Input の利用が確認できません",
);

check(
  "UF-04",
  "入力未設定時に destructive トーストでエラー通知する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "if (name.trim().length === 0)") &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", 'variant: "destructive"') &&
    includes("src/components/app/screens/WardrobeCreateScreen.tsx", "WARDROBE_STRINGS.create.errors.nameRequired"),
  "入力エラー時のトースト通知実装が不足しています",
);

check(
  "UF-05",
  "作成成功時はデモワードローブのホームへ遷移する",
  includes("src/components/app/screens/WardrobeCreateScreen.tsx", "router.push(ROUTES.home(DEMO_IDS.wardrobe));"),
  "WardrobeCreateScreen.tsx の遷移先が仕様と一致しません",
);

check(
  "UF-06",
  "ワードローブ文言に入力エラー文言が定義されている",
  includes("src/features/wardrobe/strings.ts", "nameRequired") &&
    includes("src/features/wardrobe/strings.ts", "ワードローブ名を入力してください。"),
  "features/wardrobe/strings.ts に入力エラー文言が見つかりません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
