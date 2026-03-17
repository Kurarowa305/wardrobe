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

const target = "src/components/app/screens/ClothingCreateScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

check(
  "CCS-01",
  "服追加画面が src/components/app/screens/ClothingCreateScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CCS-02",
  "服追加画面が client component で、追加mutationとフォーム状態を持つ",
  includes(target, '"use client";') &&
    includes(target, 'import { useCreateClothingMutation } from "@/api/hooks/clothing";') &&
    includes(target, 'const [name, setName] = useState("");') &&
    includes(target, "const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);") &&
    includes(target, "const createMutation = useCreateClothingMutation(wardrobeId);"),
  "client component化、useCreateClothingMutation、入力state実装が不足しています",
);

check(
  "CCS-03",
  "服名未入力時に保存不可かつエラーメッセージを表示する",
  includes(target, "const isNameEmpty = trimmedName.length === 0;") &&
    includes(target, "disabled={isNameEmpty || isPending}") &&
    includes(target, "CLOTHING_STRINGS.create.messages.nameRequired"),
  "服名必須バリデーション（disabled/エラー表示）の実装が不足しています",
);

check(
  "CCS-04",
  "保存成功時に服一覧へ遷移する",
  includes(target, "const router = useRouter();") &&
    includes(target, "await createMutation.mutateAsync({") &&
    includes(target, "router.push(ROUTES.clothings(wardrobeId));"),
  "保存成功後の一覧遷移（router.push）が不足しています",
);

check(
  "CCS-05",
  "服追加画面が画像選択UIと服名入力UIを持ち、imageKey入力を持たない",
  includes(target, 'name="imageFile"') &&
    includes(target, 'type="file"') &&
    includes(target, "CLOTHING_STRINGS.create.labels.name") &&
    includes(target, 'name="name"') &&
    !includes(target, 'name="imageKey"'),
  "画像ファイル/服名入力の定義、またはimageKey入力削除が不足しています",
);

check(
  "CCS-06",
  "服追加時はアップロード成功時の imageKey を保存payloadに設定する",
  includes(target, "const uploadImage = async (file: File): Promise<string> => {") &&
    includes(target, "const presigned = await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(target, "uploadedImageKey = await uploadImage(selectedImageFile);") &&
    includes(target, "imageKey: uploadedImageKey,"),
  "追加時の imageKey 設定が presign返却キー連携になっていません",
);

check(
  "CCS-07",
  "服追加画面向け文言が clothing strings に定義される",
  includes(stringsTarget, 'nameRequired: "服の名前を入力してください。"') &&
    includes(stringsTarget, 'submitting: "追加中..."') &&
    includes(stringsTarget, 'submitError: "服の追加に失敗しました。"') &&
    includes(stringsTarget, 'imageFile: "画像ファイル"') &&
    includes(stringsTarget, 'name: "例: 白シャツ"'),
  "features/clothing/strings.ts の服追加画面文言定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
