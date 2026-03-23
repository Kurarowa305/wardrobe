import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;
const abs = (relPath) => path.join(webRoot, relPath);
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}\n  ${detail}`); }
check("TF-01", "TemplateCreateScreen と TemplateEditScreen が TemplateForm を利用する", includes("src/components/app/screens/TemplateCreateScreen.tsx", 'createElement(TemplateForm') && includes("src/components/app/screens/TemplateEditScreen.tsx", 'createElement(TemplateForm'), "TemplateForm 利用が不足しています");
check("TF-02", "TemplateForm がテンプレート名入力とジャンル別服複数選択UIを提供する", includes("src/components/app/screens/TemplateForm.tsx", 'import { Input } from "@/components/ui/input";') && includes("src/components/app/screens/TemplateForm.tsx", 'selectedClothingIds') && includes("src/components/app/screens/TemplateForm.tsx", 'ClothingGenreSection') && includes("src/components/app/screens/TemplateForm.tsx", 'selectable'), "ジャンル別複数選択UIが不足しています");
check("TF-03", "TemplateForm は create/update mutation を使い分け、送信成功後に遷移する", includes("src/components/app/screens/TemplateForm.tsx", 'await createMutation.mutateAsync(payload);') && includes("src/components/app/screens/TemplateForm.tsx", 'await updateMutation.mutateAsync(payload);') && includes("src/components/app/screens/TemplateForm.tsx", 'appendOperationToast(ROUTES.templates(wardrobeId), OPERATION_TOAST_IDS.templateCreated)') && includes("src/components/app/screens/TemplateForm.tsx", 'appendOperationToast(ROUTES.templateDetail(wardrobeId, templateId), OPERATION_TOAST_IDS.templateUpdated)'), "送信処理または遷移が不足しています");
check("TF-04", "服一覧取得はジャンル別 limit 指定とジャンル別自動読み込みに対応している", includes("src/components/app/screens/TemplateForm.tsx", 'const TEMPLATE_FORM_CLOTHING_LIMIT = 50;') && includes("src/components/app/screens/TemplateForm.tsx", 'genre: "tops"') && includes("src/components/app/screens/TemplateForm.tsx", 'handleLoadMore(genre)') && includes("src/components/app/screens/ClothingGenreSection.tsx", '<AutoLoadTrigger'), "ジャンル別自動読み込みが不足しています");
check("TF-05", "Template strings に clothingSectionEmpty を定義する", includes("src/features/template/strings.ts", 'clothingSectionEmpty: "このジャンルで選択できる服はまだ登録されていません。"'), "clothingSectionEmpty 文言が不足しています");
check("TF-06", "TemplateForm はキャンセルボタンを描画せず固定保存ボタンを表示する", !includes("src/components/app/screens/TemplateForm.tsx", 'variant="outline"') && includes("src/components/app/screens/TemplateForm.tsx", 'fixed bottom-0 left-1/2') && includes("src/components/app/screens/TemplateForm.tsx", 'pb-24'), "固定保存ボタンの実装が不足しています");
check("TF-07", "各セクションが見出し・折りたたみ・同ジャンルアイコンを持つ", includes("src/components/app/screens/ClothingGenreSection.tsx", 'ClothingGenreIcon genre={genre}') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'aria-expanded={!collapsed}') && includes("src/components/app/screens/ClothingGenreSection.tsx", 'toggleLabel'), "見出し/折りたたみ/アイコン付きセクションが不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
