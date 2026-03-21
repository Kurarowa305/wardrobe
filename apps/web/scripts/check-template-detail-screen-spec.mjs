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

const target = "src/components/app/screens/TemplateDetailScreen.tsx";
const stringsTarget = "src/features/template/strings.ts";
const hasTemplateHookImport =
  includes(target, 'import { useTemplate } from "@/api/hooks/template";') ||
  includes(target, 'import { useDeleteTemplateMutation, useTemplate } from "@/api/hooks/template";');

check(
  "TDS-01",
  "TemplateDetailScreen が useTemplate でテンプレ詳細を取得し、ロード/エラー状態を表示する",
  hasTemplateHookImport &&
    includes(target, "const templateQuery = useTemplate(wardrobeId, templateId);") &&
    includes(target, "templateQuery.isPending") &&
    includes(target, "templateQuery.isError") &&
    includes(target, "resolveErrorMessage(templateQuery.error)"),
  "詳細取得 hook またはロード/エラー表示の実装が不足しています",
);

check(
  "TDS-02",
  "テンプレ詳細画面がテンプレ名・着用情報・構成アイテム一覧を表示する",
  includes(target, "templateQuery.data.name") &&
    includes(target, "TEMPLATE_STRINGS.detail.labels.wearCount") &&
    includes(target, "TEMPLATE_STRINGS.detail.labels.lastWornAt") &&
    includes(target, "TEMPLATE_STRINGS.detail.labels.clothingItems") &&
    includes(target, "templateQuery.data.clothingItems.map((item) => {") &&
    includes(target, "item.wearCount") &&
    includes(target, "formatLastWornDate(item.lastWornAt, TEMPLATE_STRINGS.detail.messages.neverWorn)"),
  "テンプレ詳細の主要表示項目または曜日付き構成アイテム一覧が不足しています",
);

check(
  "TDS-03",
  "構成アイテムが非リンク表示で、画像/プレースホルダ/削除済み表示に対応する",
  !includes(target, "ROUTES.clothingDetail(wardrobeId, item.clothingId)") &&
    !includes(target, "import Link from \"next/link\";") &&
    includes(target, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(target, "const imageUrl = resolveImageUrl(item.imageKey);") &&
    includes(target, "COMMON_STRINGS.placeholders.noImage") &&
    includes(target, "TEMPLATE_STRINGS.detail.messages.clothingDeleted"),
  "構成アイテムの非リンク表示・画像表示・削除済み表示の実装が不足しています",
);

check(
  "TDS-04",
  "テンプレ詳細画面のヘッダーメニューに編集/削除があり、削除済み時は無効化される",
  includes(target, "headerActions:") &&
    includes(target, "TEMPLATE_STRINGS.detail.menu.edit") &&
    includes(target, "TEMPLATE_STRINGS.detail.menu.delete") &&
    includes(target, "disabled: !templateQuery.data || templateQuery.data.deleted"),
  "ヘッダーメニューまたは削除済みテンプレート時の無効化が不足しています",
);

check(
  "TDS-05",
  "Template strings に詳細画面向けのラベル・状態文言が定義される",
  includes(stringsTarget, 'wearCount: "着た回数"') &&
    includes(stringsTarget, 'lastWornAt: "最後に着た日"') &&
    includes(stringsTarget, 'clothingItems: "構成アイテム"') &&
    includes(stringsTarget, 'error: "テンプレート詳細の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'clothingDeleted: "削除済みの服です"') &&
    includes(stringsTarget, 'neverWorn: "未着用"'),
  "詳細画面向け文言の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
