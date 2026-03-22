import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;
const abs = (relPath) => path.join(webRoot, relPath);
const exists = (relPath) => fs.existsSync(abs(relPath));
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}\n  ${detail}`); }
const target = "src/components/app/screens/ClothingEditScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";
check("CES-01", "服編集画面が存在する", exists(target), `${target} が存在しません`);
check("CES-02", "useClothing と useUpdateClothingMutation を利用する", includes(target, 'const clothingQuery = useClothing(wardrobeId, clothingId);') && includes(target, 'const updateMutation = useUpdateClothingMutation(wardrobeId, clothingId);'), "hook 利用が不足しています");
check("CES-03", "既存データ取得後に name/imageKey/genre を反映する", includes(target, 'setName(clothingQuery.data.name);') && includes(target, 'setImageKey(clothingQuery.data.imageKey ?? "");') && includes(target, 'setGenre(clothingQuery.data.genre);'), "初期値反映が不足しています");
check("CES-04", "初期値取得完了前はローディング表示し、404を切り分ける", includes(target, 'CLOTHING_STRINGS.edit.messages.loading') && includes(target, 'if (isAppError(error) && error.status === 404)') && includes(target, 'CLOTHING_STRINGS.detail.messages.notFound'), "ローディングまたは404切り分けが不足しています");
check("CES-05", "服名・ジャンルのバリデーションを持つ", includes(target, 'const isNameEmpty = trimmedName.length === 0;') && includes(target, 'const isGenreEmpty = genre.length === 0;') && includes(target, 'CLOTHING_STRINGS.edit.messages.genreRequired'), "name/genre バリデーションが不足しています");
check("CES-06", "更新成功時に詳細画面へ遷移し、genre を payload に含める", includes(target, 'await updateMutation.mutateAsync({ name: trimmedName, genre: genre as ClothingGenreDto, imageKey: nextImageKey });') && includes(target, 'router.push(appendOperationToast(ROUTES.clothingDetail(wardrobeId, clothingId), OPERATION_TOAST_IDS.clothingUpdated));'), "更新 payload または遷移が不足しています");
check("CES-07", "編集画面向け文言に genreRequired を定義する", includes(stringsTarget, 'genreRequired: "服のジャンルを選択してください。"'), "genreRequired 文言が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
