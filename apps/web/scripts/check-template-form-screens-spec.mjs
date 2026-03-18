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

const createTarget = "src/components/app/screens/TemplateCreateScreen.tsx";
const editTarget = "src/components/app/screens/TemplateEditScreen.tsx";
const formTarget = "src/components/app/screens/TemplateForm.tsx";
const stringsTarget = "src/features/template/strings.ts";

check(
  "TFS-01",
  "テンプレート追加/編集画面と共通フォームが所定ファイルに存在する",
  exists(createTarget) && exists(editTarget) && exists(formTarget),
  "テンプレート追加/編集画面、または共通フォームが不足しています",
);

check(
  "TFS-02",
  "追加画面が useClothingList と useCreateTemplateMutation を利用し一覧遷移する",
  includes(createTarget, '"use client";') &&
    includes(createTarget, 'import { useClothingList } from "@/api/hooks/clothing";') &&
    includes(createTarget, 'import { useCreateTemplateMutation } from "@/api/hooks/template";') &&
    includes(createTarget, 'const clothingListQuery = useClothingList(wardrobeId, { limit: TEMPLATE_FORM_CLOTHING_LIMIT });') &&
    includes(createTarget, 'const createMutation = useCreateTemplateMutation(wardrobeId);') &&
    includes(createTarget, 'router.push(ROUTES.templates(wardrobeId));'),
  "追加画面の服一覧取得、作成mutation、または保存成功後の一覧遷移が不足しています",
);

check(
  "TFS-03",
  "追加画面がテンプレ名必須・服1件以上必須で create payload に clothingIds を設定する",
  includes(createTarget, 'const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);') &&
    includes(createTarget, 'if (trimmedName.length === 0 || selectedClothingIds.length === 0 || isPending) {') &&
    includes(createTarget, 'clothingIds: selectedClothingIds,') &&
    includes(formTarget, 'disabled={trimmedName.length === 0 || selectedClothingIds.length === 0 || isSubmitting}') &&
    includes(formTarget, 'type="checkbox"') &&
    includes(formTarget, 'name="clothingIds"'),
  "テンプレ名/服選択バリデーション、または clothingIds 送信実装が不足しています",
);

check(
  "TFS-04",
  "編集画面が useTemplate と useUpdateTemplateMutation で既存値を反映し詳細遷移する",
  includes(editTarget, 'import { useTemplate, useUpdateTemplateMutation } from "@/api/hooks/template";') &&
    includes(editTarget, 'const templateQuery = useTemplate(wardrobeId, templateId);') &&
    includes(editTarget, 'const updateMutation = useUpdateTemplateMutation(wardrobeId, templateId);') &&
    includes(editTarget, 'setName(templateQuery.data.name);') &&
    includes(editTarget, 'setSelectedClothingIds(templateQuery.data.clothingItems.map((item) => item.clothingId));') &&
    includes(editTarget, 'router.push(ROUTES.templateDetail(wardrobeId, templateId));'),
  "編集画面の既存値反映、更新mutation、または保存成功後の詳細遷移が不足しています",
);

check(
  "TFS-05",
  "編集画面が404と一般エラーを切り分け、服一覧取得エラーも表示できる",
  includes(editTarget, 'if (isAppError(error) && error.status === 404) {') &&
    includes(editTarget, 'return TEMPLATE_STRINGS.detail.messages.notFound;') &&
    includes(editTarget, 'return TEMPLATE_STRINGS.edit.messages.loadError;') &&
    includes(editTarget, '? TEMPLATE_STRINGS.edit.messages.clothingLoadError') &&
    includes(editTarget, 'const loading = templateQuery.isPending || clothingListQuery.isPending;'),
  "編集画面のロード状態・404/一般エラー・服一覧エラー切り分けが不足しています",
);

check(
  "TFS-06",
  "共通フォームがテンプレ名入力、服複数選択、空状態、送信エラー表示を持つ",
  includes(formTarget, 'placeholder={strings.placeholders.name}') &&
    includes(formTarget, 'selectedClothingIds.includes(item.clothingId)') &&
    includes(formTarget, 'strings.messages.emptyClothing') &&
    includes(formTarget, 'strings.messages.clothingRequired') &&
    includes(formTarget, 'strings.messages.submitError'),
  "共通フォームの入力UIまたは状態表示が不足しています",
);

check(
  "TFS-07",
  "テンプレート追加/編集画面向け文言が template strings に定義される",
  includes(stringsTarget, 'nameRequired: "テンプレート名を入力してください。"') &&
    includes(stringsTarget, 'clothingRequired: "構成服を1つ以上選択してください。"') &&
    includes(stringsTarget, 'submitError: "テンプレートの追加に失敗しました。"') &&
    includes(stringsTarget, 'submitError: "テンプレートの更新に失敗しました。"') &&
    includes(stringsTarget, 'emptyClothing: "選択できる服がまだ登録されていません。"') &&
    includes(stringsTarget, 'notFound: "テンプレートが見つかりません。"'),
  "template strings の追加/編集/詳細向け文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
