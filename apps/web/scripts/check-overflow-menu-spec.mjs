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

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "OM-01",
  "Header が actions props を受け取り OverflowMenu を表示できる",
  includes("src/components/app/navigation/Header.tsx", "actions?: HeaderAction[];") &&
    includes("src/components/app/navigation/Header.tsx", "<OverflowMenu actions={actions} />"),
  "Header.tsx に actions props または OverflowMenu 描画が不足しています",
);

check(
  "OM-02",
  "AppLayout から headerActions を Header に受け渡している",
  includes("src/components/app/layout/AppLayout.tsx", "headerActions?: HeaderAction[];") &&
    includes("src/components/app/layout/AppLayout.tsx", "<Header title={title} backHref={backHref} actions={headerActions} />"),
  "AppLayout.tsx で headerActions の定義または受け渡しが不足しています",
);

check(
  "OM-03",
  "服詳細画面の画面内編集/削除リンクを廃止し、ヘッダーメニュー化している",
  includes("src/components/app/screens/ClothingDetailScreen.tsx", "headerActions:") &&
    includes("src/components/app/screens/ClothingDetailScreen.tsx", "CLOTHING_STRINGS.detail.menu.edit") &&
    includes("src/components/app/screens/ClothingDetailScreen.tsx", "CLOTHING_STRINGS.detail.menu.delete") &&
    !includes("src/components/app/screens/ClothingDetailScreen.tsx", "screen-link-list"),
  "ClothingDetailScreen.tsx のメニュー移行が未完了です",
);

check(
  "OM-04",
  "テンプレート詳細画面の画面内編集/削除リンクを廃止し、ヘッダーメニュー化している",
  includes("src/components/app/screens/TemplateDetailScreen.tsx", "headerActions:") &&
    includes("src/components/app/screens/TemplateDetailScreen.tsx", "TEMPLATE_STRINGS.detail.menu.edit") &&
    includes("src/components/app/screens/TemplateDetailScreen.tsx", "TEMPLATE_STRINGS.detail.menu.delete") &&
    !includes("src/components/app/screens/TemplateDetailScreen.tsx", "screen-link-list"),
  "TemplateDetailScreen.tsx のメニュー移行が未完了です",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
