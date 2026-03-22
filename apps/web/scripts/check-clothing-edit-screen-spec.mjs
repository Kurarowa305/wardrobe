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

const target = "src/components/app/screens/ClothingEditScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

check(
  "CES-01",
  "服編集画面が src/components/app/screens/ClothingEditScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CES-02",
  "服編集画面が useClothing と useUpdateClothingMutation を利用する",
  includes(target, 'import { useClothing, useUpdateClothingMutation } from "@/api/hooks/clothing";') &&
    includes(target, "const clothingQuery = useClothing(wardrobeId, clothingId);") &&
    includes(target, "const updateMutation = useUpdateClothingMutation(wardrobeId, clothingId);"),
  "既存値取得または更新mutation連携が不足しています",
);

check(
  "CES-03",
  "既存データ取得後にフォーム初期値（name/imageKey）を反映する",
  includes(target, "useEffect(() => {") &&
    includes(target, "setName(clothingQuery.data.name);") &&
    includes(target, 'setImageKey(clothingQuery.data.imageKey ?? "");'),
  "既存値反映の useEffect 実装が不足しています",
);

check(
  "CES-04",
  "初期値取得完了前はローディング表示し、取得失敗時はエラー表示する",
  includes(target, "CLOTHING_STRINGS.edit.messages.loading") &&
    includes(target, "CLOTHING_STRINGS.edit.messages.loadError") &&
    includes(target, "if (isAppError(error) && error.status === 404)") &&
    includes(target, "CLOTHING_STRINGS.detail.messages.notFound"),
  "ローディングまたはエラー表示（404切り分け）の実装が不足しています",
);

check(
  "CES-05",
  "服名未入力時に保存不可かつエラーメッセージを表示する",
  includes(target, "const isNameEmpty = trimmedName.length === 0;") &&
    includes(target, "disabled={isNameEmpty || isPending}") &&
    includes(target, "CLOTHING_STRINGS.edit.messages.nameRequired"),
  "服名必須バリデーション（disabled/エラー表示）の実装が不足しています",
);

check(
  "CES-06",
  "更新成功時に詳細画面へ遷移する",
  includes(target, "await updateMutation.mutateAsync({") &&
    includes(target, "router.push(appendOperationToast(ROUTES.clothingDetail(wardrobeId, clothingId), OPERATION_TOAST_IDS.clothingUpdated));"),
  "更新成功後の詳細遷移（router.push）が不足しています",
);

check(
  "CES-07",
  "服編集画面向け文言が clothing strings に定義される",
  includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'loadError: "服編集画面の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'nameRequired: "服の名前を入力してください。"') &&
    includes(stringsTarget, 'submitting: "保存中..."') &&
    includes(stringsTarget, 'submitError: "服の更新に失敗しました。"') &&
    includes(stringsTarget, 'imageFile: "画像ファイル"') &&
    includes(stringsTarget, 'name: "例: 白シャツ"'),
  "features/clothing/strings.ts の服編集画面文言定義が不足しています",
);

check(
  "CES-08",
  "服編集画面は imageKey 入力を持たず、画像選択時はアップロード結果の imageKey を送る",
  !includes(target, 'name="imageKey"') &&
    includes(target, "const uploadImage = async (file: File): Promise<string> => {") &&
    includes(target, "const presigned = await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(target, "let nextImageKey = imageKey.trim().length > 0 ? imageKey.trim() : null;") &&
    includes(target, "nextImageKey = await uploadImage(selectedImageFile);") &&
    includes(target, "imageKey: nextImageKey,"),
  "imageKey入力の削除、または画像選択時のpresign imageKey連携が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
