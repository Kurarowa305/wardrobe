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

check(
  "IPA-01",
  "presign APIスキーマが src/api/schemas/image.ts に存在する",
  exists("src/api/schemas/image.ts"),
  "src/api/schemas/image.ts が存在しません",
);

check(
  "IPA-02",
  "presign APIクライアントが src/api/endpoints/image.ts に存在する",
  exists("src/api/endpoints/image.ts"),
  "src/api/endpoints/image.ts が存在しません",
);

check(
  "IPA-03",
  "presign APIクライアントは getPresignedUrl を公開する",
  includes("src/api/endpoints/image.ts", "export function getPresignedUrl("),
  "getPresignedUrl が公開されていません",
);

check(
  "IPA-04",
  "presign APIクライアントは fetch wrapper（apiClient.post）経由で実装される",
  includes("src/api/endpoints/image.ts", 'import { apiClient } from "@/api/client";') &&
    includes("src/api/endpoints/image.ts", "apiClient.post<GetPresignedUrlResponseDto, GetPresignedUrlRequestDto>("),
  "apiClient.post 経由のDTO付き実装が不足しています",
);

check(
  "IPA-05",
  "presign APIパスが /wardrobes/{wardrobeId}/images/presign 形式で統一される",
  includes("src/api/endpoints/image.ts", "return `/wardrobes/${wardrobeId}/images/presign`;"),
  "presign APIパスの組み立て実装が不足しています",
);

check(
  "IPA-06",
  "presign リクエストDTOが contentType/category/extension? を持つ",
  includes("src/api/schemas/image.ts", "export type ImageCategoryDto = \"clothing\" | \"template\";") &&
    includes("src/api/schemas/image.ts", "export type GetPresignedUrlRequestDto = {") &&
    includes("src/api/schemas/image.ts", "contentType: string;") &&
    includes("src/api/schemas/image.ts", "category: ImageCategoryDto;") &&
    includes("src/api/schemas/image.ts", "extension?: string;"),
  "presign リクエストDTO定義が不足しています",
);

check(
  "IPA-07",
  "presign レスポンスDTOが imageKey/uploadUrl/method/expiresAt を持つ",
  includes("src/api/schemas/image.ts", "export type PresignedUploadMethodDto = \"PUT\";") &&
    includes("src/api/schemas/image.ts", "export type GetPresignedUrlResponseDto = {") &&
    includes("src/api/schemas/image.ts", "imageKey: string;") &&
    includes("src/api/schemas/image.ts", "uploadUrl: string;") &&
    includes("src/api/schemas/image.ts", "method: PresignedUploadMethodDto;") &&
    includes("src/api/schemas/image.ts", "expiresAt: string;"),
  "presign レスポンスDTO定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
