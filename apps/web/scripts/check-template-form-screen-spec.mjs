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

check(
  "TF-01",
  "TemplateCreateScreen と TemplateEditScreen が TemplateForm を利用している",
  includes("src/components/app/screens/TemplateCreateScreen.tsx", 'import { TemplateForm } from "./TemplateForm";') &&
    includes("src/components/app/screens/TemplateCreateScreen.tsx", "createElement(TemplateForm") &&
    includes("src/components/app/screens/TemplateEditScreen.tsx", 'import { TemplateForm } from "./TemplateForm";') &&
    includes("src/components/app/screens/TemplateEditScreen.tsx", "createElement(TemplateForm"),
  "テンプレート追加/編集画面の TemplateForm 利用が不足しています",
);

check(
  "TF-02",
  "TemplateForm がテンプレート名入力と服複数選択UIを提供している",
  includes("src/components/app/screens/TemplateForm.tsx", 'import { Input } from "@/components/ui/input";') &&
    includes("src/components/app/screens/TemplateForm.tsx", 'type="checkbox"') &&
    includes("src/components/app/screens/TemplateForm.tsx", "selectedClothingIds") &&
    includes("src/components/app/screens/TemplateForm.tsx", "TEMPLATE_STRINGS.messages.clothingRequired"),
  "TemplateForm の入力UIまたは複数選択UIが不足しています",
);

check(
  "TF-03",
  "TemplateForm は create/update mutation を使い分け、送信成功後に遷移する",
  includes("src/components/app/screens/TemplateForm.tsx", "useCreateTemplateMutation") &&
    includes("src/components/app/screens/TemplateForm.tsx", "useUpdateTemplateMutation") &&
    includes("src/components/app/screens/TemplateForm.tsx", "await createMutation.mutateAsync(payload);") &&
    includes("src/components/app/screens/TemplateForm.tsx", "await updateMutation.mutateAsync(payload);") &&
    includes("src/components/app/screens/TemplateForm.tsx", "router.push(ROUTES.templates(wardrobeId));") &&
    includes("src/components/app/screens/TemplateForm.tsx", "router.push(ROUTES.templateDetail(wardrobeId, templateId));"),
  "TemplateForm の送信処理または遷移処理が不足しています",
);

check(
  "TF-04",
  "服一覧取得は API の limit 上限を意識した定数指定と追加読み込みに対応している",
  includes("src/components/app/screens/TemplateForm.tsx", "const TEMPLATE_FORM_CLOTHING_LIMIT = 50;") &&
    includes("src/components/app/screens/TemplateForm.tsx", "limit: TEMPLATE_FORM_CLOTHING_LIMIT,") &&
    includes("src/components/app/screens/TemplateForm.tsx", "setCursor(nextCursor);") &&
    includes("src/components/app/screens/TemplateForm.tsx", "TEMPLATE_STRINGS.actions.loadMoreClothings"),
  "服一覧取得時の limit 管理または追加読み込み対応が不足しています",
);

check(
  "TF-05",
  "Template strings にフォーム用の入力・エラー・服一覧文言が定義されている",
  includes("src/features/template/strings.ts", "nameRequired") &&
    includes("src/features/template/strings.ts", "clothingRequired") &&
    includes("src/features/template/strings.ts", "loadMoreClothings") &&
    includes("src/features/template/strings.ts", "submitError"),
  "Template strings のフォーム用文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
