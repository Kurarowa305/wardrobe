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

const createScreen = "src/components/app/screens/ClothingCreateScreen.tsx";
const editScreen = "src/components/app/screens/ClothingEditScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

check(
  "CIS-01",
  "服追加画面に画像ファイル選択UIがある",
  includes(createScreen, 'name="imageFile"') &&
    includes(createScreen, 'type="file"') &&
    includes(createScreen, 'accept="image/*"') &&
    includes(createScreen, "setSelectedImageFile(event.target.files?.[0] ?? null)"),
  "服追加画面の画像選択input実装が不足しています",
);

check(
  "CIS-02",
  "服追加画面で画像プレビューとクリア導線を表示できる",
  includes(createScreen, "const [previewUrl, setPreviewUrl] = useState<string | null>(null);") &&
    includes(createScreen, "URL.createObjectURL(selectedImageFile)") &&
    includes(createScreen, "URL.revokeObjectURL(objectUrl)") &&
    includes(createScreen, "<img") &&
    includes(createScreen, "clearSelectedImage") &&
    includes(createScreen, "CLOTHING_STRINGS.create.actions.clearImage"),
  "服追加画面の画像プレビュー/クリア実装が不足しています",
);

check(
  "CIS-03",
  "服編集画面に画像ファイル選択UIとプレビュー/クリア導線がある",
  includes(editScreen, 'name="imageFile"') &&
    includes(editScreen, 'type="file"') &&
    includes(editScreen, 'accept="image/*"') &&
    includes(editScreen, "setSelectedImageFile(event.target.files?.[0] ?? null)") &&
    includes(editScreen, "const [previewUrl, setPreviewUrl] = useState<string | null>(null);") &&
    includes(editScreen, "URL.createObjectURL(selectedImageFile)") &&
    includes(editScreen, "URL.revokeObjectURL(objectUrl)") &&
    includes(editScreen, "<img") &&
    includes(editScreen, "clearSelectedImage") &&
    includes(editScreen, "CLOTHING_STRINGS.edit.actions.clearImage"),
  "服編集画面の画像選択/プレビュー/クリア実装が不足しています",
);

check(
  "CIS-04",
  "画像選択UI向け文言が clothing strings に追加されている",
  includes(stringsTarget, 'imageFile: "画像ファイル"') &&
    includes(stringsTarget, 'clearImage: "画像をクリア"') &&
    includes(stringsTarget, 'noPreview: "画像を選択するとここにプレビューが表示されます。"') &&
    includes(stringsTarget, 'previewAlt: "選択した画像のプレビュー"'),
  "features/clothing/strings.ts の画像選択UI向け文言が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
