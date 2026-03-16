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
  "CA-01",
  "Clothing APIクライアントが src/api/endpoints/clothing.ts に存在する",
  exists("src/api/endpoints/clothing.ts"),
  "src/api/endpoints/clothing.ts が存在しません",
);

check(
  "CA-02",
  "Clothing APIクライアントは fetch wrapper（apiClient）経由で実装される",
  includes("src/api/endpoints/clothing.ts", 'import { apiClient } from "@/api/client";') &&
    includes("src/api/endpoints/clothing.ts", "apiClient.get<") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.post<") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.patch<") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.delete<"),
  "apiClient 経由の実装（GET/POST/PATCH/DELETE）が不足しています",
);

check(
  "CA-03",
  "MS1-T03で定義された list/get/create/update/delete が公開される",
  includes("src/api/endpoints/clothing.ts", "export function listClothings(") &&
    includes("src/api/endpoints/clothing.ts", "export function getClothing(") &&
    includes("src/api/endpoints/clothing.ts", "export function createClothing(") &&
    includes("src/api/endpoints/clothing.ts", "export function updateClothing(") &&
    includes("src/api/endpoints/clothing.ts", "export function deleteClothing("),
  "Clothing APIクライアント関数の公開が不足しています",
);

check(
  "CA-04",
  "一覧/詳細取得の戻り値がDTO型（ClothingListResponseDto / ClothingDetailResponseDto）で返る",
  includes("src/api/endpoints/clothing.ts", "Promise<ClothingListResponseDto>") &&
    includes("src/api/endpoints/clothing.ts", "Promise<ClothingDetailResponseDto>") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.get<ClothingListResponseDto>") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.get<ClothingDetailResponseDto>"),
  "一覧または詳細のDTO戻り値型定義が不足しています",
);

check(
  "CA-05",
  "一覧APIは order/limit/cursor を query として渡せる",
  includes("src/api/schemas/clothing.ts", "export type ClothingListParamsDto = {") &&
    includes("src/api/schemas/clothing.ts", "order?: ClothingListOrderDto;") &&
    includes("src/api/schemas/clothing.ts", "limit?: number;") &&
    includes("src/api/schemas/clothing.ts", "cursor?: string | null;") &&
    includes("src/api/endpoints/clothing.ts", "params: ClothingListParamsDto = {}") &&
    includes("src/api/endpoints/clothing.ts", "query: params,"),
  "一覧クエリパラメータDTOまたは query 受け渡し実装が不足しています",
);

check(
  "CA-06",
  "作成/更新APIはリクエストDTO（Create/UpdateClothingRequestDto）をbodyで送る",
  includes("src/api/schemas/clothing.ts", "export type CreateClothingRequestDto = {") &&
    includes("src/api/schemas/clothing.ts", "export type UpdateClothingRequestDto = {") &&
    includes("src/api/endpoints/clothing.ts", "body: CreateClothingRequestDto,") &&
    includes("src/api/endpoints/clothing.ts", "body: UpdateClothingRequestDto,") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.post<void, CreateClothingRequestDto>") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.patch<void, UpdateClothingRequestDto>"),
  "作成/更新のリクエストDTO定義または body 送信実装が不足しています",
);

check(
  "CA-07",
  "服APIパスが /wardrobes/{wardrobeId}/clothing(/:clothingId) 形式で統一される",
  includes("src/api/endpoints/clothing.ts", "return `/wardrobes/${wardrobeId}/clothing`;") &&
    includes(
      "src/api/endpoints/clothing.ts",
      "return `${buildClothingCollectionPath(wardrobeId)}/${clothingId}`;",
    ),
  "服APIパスの組み立て実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
