import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function abs(relPath) { return path.join(webRoot, relPath); }
function exists(relPath) { return fs.existsSync(abs(relPath)); }
function read(relPath) { return fs.readFileSync(abs(relPath), "utf8"); }
function includes(relPath, expected) { return read(relPath).includes(expected); }
function matches(relPath, pattern) { return pattern.test(read(relPath)); }
function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) { console.log(`PASS ${id}: ${description}`); return; }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check("CT-01", "clothing schema ファイルが存在する", exists("src/api/schemas/clothing.ts"), "schema が存在しません");
check("CT-02", "Clothing API DTO が status と genre を含めて定義される", includes("src/api/schemas/clothing.ts", 'export type ClothingStatusDto = "ACTIVE" | "DELETED";') && includes("src/api/schemas/clothing.ts", 'export type ClothingGenreDto = "tops" | "bottoms" | "others";') && includes("src/api/schemas/clothing.ts", 'genre: ClothingGenreDto;'), "status/genre DTO が不足しています");
check("CT-03", "一覧/詳細レスポンスDTOに genre と nextCursor を含む", includes("src/api/schemas/clothing.ts", 'export type ClothingListItemDto = Pick<ClothingDto, "clothingId" | "name" | "genre" | "imageKey">;') && includes("src/api/schemas/clothing.ts", 'nextCursor: string | null;'), "一覧DTOの genre または nextCursor が不足しています");
check("CT-04", "画面表示用VMが genre を保持する", exists("src/features/clothing/types.ts") && includes("src/features/clothing/types.ts", 'genre: ClothingGenreDto;') && includes("src/features/clothing/types.ts", 'genre: dto.genre,'), "VMの genre 定義が不足しています");
check("CT-05", "Clothing VM が deleted フラグを持つ", includes("src/features/clothing/types.ts", 'deleted: boolean;') && includes("src/features/clothing/types.ts", 'deleted: dto.status === "DELETED",'), "deleted フラグが不足しています");
check("CT-06", "未着用を null に正規化する", includes("src/features/clothing/types.ts", 'lastWornAt: number | null;') && includes("src/features/clothing/types.ts", 'lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,'), "lastWornAt 正規化が不足しています");
check("CT-07", "一覧VMは deleted を持たない", includes("src/features/clothing/types.ts", 'export function toClothingListItem(dto: ClothingListItemDto): ClothingListItem {') && !matches("src/features/clothing/types.ts", /export type ClothingListItem = \{[^}]*deleted:\s*boolean;/), "一覧VMに deleted が含まれています");

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
