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

const createScreen = "src/components/app/screens/ClothingCreateScreen.tsx";
const editScreen = "src/components/app/screens/ClothingEditScreen.tsx";
const clothingSchema = "src/api/schemas/clothing.ts";
const mutationHooks = "src/api/hooks/clothing.ts";
const clothingHandler = "src/mocks/handlers/clothing.ts";
const listScreen = "src/components/app/screens/ClothingsTabScreen.tsx";
const detailScreen = "src/components/app/screens/ClothingDetailScreen.tsx";

check(
  "IKP-01",
  "服追加画面で擬似アップロード結果の imageKey を取得できる",
  exists(createScreen) &&
    includes(createScreen, "const uploadImage = async (file: File): Promise<string> => {") &&
    includes(createScreen, "const presigned = await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(createScreen, "return presigned.imageKey;"),
  "服追加画面で presign返却 imageKey の取得処理が不足しています",
);

check(
  "IKP-02",
  "服追加画面の保存payloadがアップロード成功後の imageKey を使う",
  includes(createScreen, "let uploadedImageKey: string | null = null;") &&
    includes(createScreen, "uploadedImageKey = await uploadImage(selectedImageFile);") &&
    includes(createScreen, "imageKey: uploadedImageKey,"),
  "服追加画面の create payload にアップロード後imageKeyが組み込まれていません",
);

check(
  "IKP-03",
  "服編集画面で擬似アップロード結果の imageKey を取得できる",
  exists(editScreen) &&
    includes(editScreen, "const uploadImage = async (file: File): Promise<string> => {") &&
    includes(editScreen, "const presigned = await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(editScreen, "return presigned.imageKey;"),
  "服編集画面で presign返却 imageKey の取得処理が不足しています",
);

check(
  "IKP-04",
  "服編集画面の保存payloadは既存imageKeyを保持しつつ、新規アップロード時は置き換える",
  includes(editScreen, "let nextImageKey = imageKey.trim().length > 0 ? imageKey.trim() : null;") &&
    includes(editScreen, "nextImageKey = await uploadImage(selectedImageFile);") &&
    includes(editScreen, "imageKey: nextImageKey,"),
  "服編集画面の update payload に imageKey 継承/置換ロジックが不足しています",
);

check(
  "IKP-05",
  "clothing create/update DTO が imageKey を受け取れる",
  includes(clothingSchema, "export type CreateClothingRequestDto = {") &&
    includes(clothingSchema, "imageKey?: string | null;") &&
    includes(clothingSchema, "export type UpdateClothingRequestDto = {"),
  "clothing create/update DTO の imageKey 定義が不足しています",
);

check(
  "IKP-06",
  "MSW clothing handler が create/update で imageKey を保存する",
  includes(clothingHandler, "imageKey: payload.imageKey ?? null,") &&
    includes(clothingHandler, "if (payload.imageKey !== undefined) {") &&
    includes(clothingHandler, "target.imageKey = payload.imageKey;"),
  "MSW clothing handler の imageKey 保存処理が不足しています",
);

check(
  "IKP-07",
  "保存後のキャッシュ更新で一覧/詳細の再取得が走る",
  includes(mutationHooks, "await invalidateClothingListQueries(queryClient, wardrobeId);") &&
    includes(mutationHooks, "queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),") &&
    includes(mutationHooks, "queryKey: queryKeys.clothing.lists(wardrobeId),"),
  "create/update 後の一覧/詳細 invalidate が不足しています",
);

check(
  "IKP-08",
  "一覧/詳細画面が imageKey を resolveImageUrl で表示に反映する",
  includes(listScreen, "const imageUrl = resolveImageUrl(item.imageKey);") &&
    includes(listScreen, "COMMON_STRINGS.placeholders.noImage") &&
    includes(detailScreen, "const imageUrl = resolveImageUrl(clothingQuery.data?.imageKey);") &&
    includes(detailScreen, "COMMON_STRINGS.placeholders.noImage"),
  "一覧/詳細画面の imageKey 反映（resolveImageUrl/no image）が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
