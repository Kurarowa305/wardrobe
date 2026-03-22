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
check("CA-01", "Clothing APIクライアントが存在する", exists("src/api/endpoints/clothing.ts"), "client が存在しません");
check("CA-02", "apiClient 経由で実装される", includes("src/api/endpoints/clothing.ts", 'import { apiClient } from "@/api/client";') && includes("src/api/endpoints/clothing.ts", 'apiClient.get<') && includes("src/api/endpoints/clothing.ts", 'apiClient.post<') && includes("src/api/endpoints/clothing.ts", 'apiClient.patch<') && includes("src/api/endpoints/clothing.ts", 'apiClient.delete<'), "apiClient 経由実装が不足しています");
check("CA-03", "list/get/create/update/delete を公開する", includes("src/api/endpoints/clothing.ts", 'export function listClothings(') && includes("src/api/endpoints/clothing.ts", 'export function getClothing(') && includes("src/api/endpoints/clothing.ts", 'export function createClothing(') && includes("src/api/endpoints/clothing.ts", 'export function updateClothing(') && includes("src/api/endpoints/clothing.ts", 'export function deleteClothing('), "client 関数公開が不足しています");
check("CA-04", "一覧/詳細取得の戻り値が DTO 型で返る", includes("src/api/endpoints/clothing.ts", 'Promise<ClothingListResponseDto>') && includes("src/api/endpoints/clothing.ts", 'Promise<ClothingDetailResponseDto>'), "DTO 戻り値型が不足しています");
check("CA-05", "一覧APIは genre/order/limit を query として渡せる", includes("src/api/schemas/clothing.ts", 'genre?: ClothingGenreDto;') && includes("src/api/schemas/clothing.ts", 'order?: ClothingListOrderDto;') && includes("src/api/schemas/clothing.ts", 'limit?: number;') && !includes("src/api/schemas/clothing.ts", 'cursor?: string | null;') && includes("src/api/endpoints/clothing.ts", 'query: params,'), "一覧 query の genre/order/limit 定義または cursor 削除が不足しています");
check("CA-06", "作成/更新APIは genre を含む DTO を body で送る", includes("src/api/schemas/clothing.ts", 'genre: ClothingGenreDto;') && includes("src/api/schemas/clothing.ts", 'genre?: ClothingGenreDto;') && includes("src/api/endpoints/clothing.ts", 'body: CreateClothingRequestDto,') && includes("src/api/endpoints/clothing.ts", 'body: UpdateClothingRequestDto,'), "genre を含む DTO 定義または body 送信が不足しています");
check("CA-07", "服APIパスが /wardrobes/{wardrobeId}/clothing(/:clothingId) 形式で統一される", includes("src/api/endpoints/clothing.ts", 'return `/wardrobes/${wardrobeId}/clothing`;') && includes("src/api/endpoints/clothing.ts", 'return `${buildClothingCollectionPath(wardrobeId)}/${clothingId}`;'), "API パス組み立てが不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
