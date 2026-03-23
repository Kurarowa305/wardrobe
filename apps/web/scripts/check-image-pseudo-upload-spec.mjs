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

const imageEndpoint = "src/api/endpoints/image.ts";
const imageHandler = "src/mocks/handlers/image.ts";
const createScreen = "src/components/app/screens/ClothingCreateScreen.tsx";
const editScreen = "src/components/app/screens/ClothingEditScreen.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

check(
  "IPU-01",
  "擬似アップロード用APIクライアントが image endpoint に存在する",
  exists(imageEndpoint) &&
    includes(imageEndpoint, "export async function uploadImageWithPresign(") &&
    includes(imageEndpoint, "const presigned = await getPresignedUrl(wardrobeId, {") &&
    includes(imageEndpoint, "category,") &&
    includes(imageEndpoint, "const uploadResponse = await fetch(presigned.uploadUrl, {") &&
    includes(imageEndpoint, 'method: "PUT",') &&
    includes(imageEndpoint, "body: file,"),
  "presign -> PUT の擬似アップロード実装が不足しています",
);

check(
  "IPU-02",
  "服追加画面がアップロード中stateを管理し、送信前に擬似アップロードを実行する",
  includes(createScreen, "const [isUploadingImage, setIsUploadingImage] = useState(false);") &&
    includes(createScreen, "const [uploadError, setUploadError] = useState<string | null>(null);") &&
    includes(createScreen, "const isPending = createMutation.isPending || isUploadingImage;") &&
    includes(createScreen, "await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(createScreen, "if (selectedImageFile) {") &&
    includes(createScreen, "await uploadImage(selectedImageFile);") &&
    includes(createScreen, "CLOTHING_STRINGS.create.messages.uploadingImage"),
  "服追加画面のアップロード状態管理またはpresign->PUT実行連携が不足しています",
);

check(
  "IPU-03",
  "服追加画面がアップロード失敗時に再試行導線を表示する",
  includes(createScreen, "const handleRetryUpload = async () => {") &&
    includes(createScreen, "CLOTHING_STRINGS.create.messages.uploadError") &&
    includes(createScreen, "CLOTHING_STRINGS.create.actions.retryUpload") &&
    includes(createScreen, "setUploadError(CLOTHING_STRINGS.create.messages.uploadError);"),
  "服追加画面のアップロード失敗リトライ導線が不足しています",
);

check(
  "IPU-04",
  "服編集画面がアップロード中stateを管理し、送信前に擬似アップロードを実行する",
  includes(editScreen, "const [isUploadingImage, setIsUploadingImage] = useState(false);") &&
    includes(editScreen, "const [uploadError, setUploadError] = useState<string | null>(null);") &&
    includes(editScreen, "const isPending = updateMutation.isPending || isUploadingImage;") &&
    includes(editScreen, "await uploadImageWithPresign(wardrobeId, \"clothing\", file);") &&
    includes(editScreen, "if (selectedImageFile) {") &&
    includes(editScreen, "await uploadImage(selectedImageFile);") &&
    includes(editScreen, "CLOTHING_STRINGS.edit.messages.uploadingImage"),
  "服編集画面のアップロード状態管理またはpresign->PUT実行連携が不足しています",
);

check(
  "IPU-05",
  "服編集画面がアップロード失敗時に再試行導線を表示する",
  includes(editScreen, "const handleRetryUpload = async () => {") &&
    includes(editScreen, "CLOTHING_STRINGS.edit.messages.uploadError") &&
    includes(editScreen, "CLOTHING_STRINGS.edit.actions.retryUpload") &&
    includes(editScreen, "setUploadError(CLOTHING_STRINGS.edit.messages.uploadError);") &&
    includes(editScreen, "disabled={isNameEmpty || isGenreEmpty || isPending}"),
  "服編集画面のアップロード失敗リトライ導線が不足しています",
);

check(
  "IPU-06",
  "MSW image handler が presign uploadUrl への PUT を受け、共通シナリオを適用できる",
  includes(imageHandler, "http.put(`${MOCK_UPLOAD_ORIGIN}/upload/:category/:wardrobeId/:fileName`") &&
    includes(imageHandler, "const scenarioResponse = await applyMockScenario(request);") &&
    includes(imageHandler, "const body = await request.arrayBuffer();") &&
    includes(imageHandler, 'return createErrorResponse(400, "VALIDATION_ERROR", "upload body is empty");'),
  "MSW upload PUT handler 実装が不足しています",
);

check(
  "IPU-07",
  "アップロード中/失敗/再試行の文言が clothing strings に定義される",
  includes(stringsTarget, 'retryUpload: "アップロードを再試行"') &&
    includes(stringsTarget, 'uploadingImage: "画像アップロード中..."') &&
    includes(stringsTarget, 'uploadError: "画像アップロードに失敗しました。再試行してください。"'),
  "features/clothing/strings.ts のアップロード関連文言が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
