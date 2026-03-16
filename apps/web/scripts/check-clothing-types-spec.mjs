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

function matches(relPath, pattern) {
  return pattern.test(read(relPath));
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
  "CT-01",
  "clothing schema ファイルが src/api/schemas/clothing.ts に存在する",
  exists("src/api/schemas/clothing.ts"),
  "src/api/schemas/clothing.ts が存在しません",
);

check(
  "CT-02",
  "Clothing API DTO が status を含めて定義される",
  includes("src/api/schemas/clothing.ts", 'export type ClothingStatusDto = "ACTIVE" | "DELETED";') &&
    includes("src/api/schemas/clothing.ts", "export type ClothingDto = {") &&
    includes("src/api/schemas/clothing.ts", "status: ClothingStatusDto;"),
  "ClothingDto または ClothingStatusDto の定義が不足しています",
);

check(
  "CT-03",
  "一覧/詳細レスポンスDTO（ClothingListResponseDto / ClothingDetailResponseDto）が定義され、詳細に clothingId を含める",
  includes("src/api/schemas/clothing.ts", "export type ClothingListResponseDto = {") &&
    includes("src/api/schemas/clothing.ts", "export type ClothingDetailResponseDto = ClothingDto;") &&
    includes("src/api/schemas/clothing.ts", "clothingId: string;") &&
    includes("src/api/schemas/clothing.ts", "nextCursor: string | null;"),
  "一覧または詳細DTOの定義が不足しています",
);

check(
  "CT-04",
  "画面表示用VMが features/clothing/types.ts に定義される",
  exists("src/features/clothing/types.ts") &&
    includes("src/features/clothing/types.ts", "export type Clothing = {") &&
    includes("src/features/clothing/types.ts", "export type ClothingListItem = {"),
  "src/features/clothing/types.ts のVM定義が不足しています",
);

check(
  "CT-05",
  "Clothing VM が deleted フラグを持ち、DTO由来の状態から表示用に分離される",
  includes("src/features/clothing/types.ts", "deleted: boolean;") &&
    includes("src/features/clothing/types.ts", "export function toClothing(dto: ClothingDto): Clothing {") &&
    includes("src/features/clothing/types.ts", 'deleted: dto.status === "DELETED",'),
  "deleted フラグまたは DTO->VM 変換の定義が不足しています",
);

check(
  "CT-06",
  "未着用（lastWornAt=0）を VM で null に正規化する",
  includes("src/features/clothing/types.ts", "lastWornAt: number | null;") &&
    includes("src/features/clothing/types.ts", "lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,"),
  "lastWornAt の正規化定義が不足しています",
);

check(
  "CT-07",
  "一覧VM（ClothingListItem / toClothingListItem）は deleted を持たない",
  includes("src/features/clothing/types.ts", "export function toClothingListItem(dto: ClothingListItemDto): ClothingListItem {") &&
    includes("src/features/clothing/types.ts", "clothingId: dto.clothingId,") &&
    includes("src/features/clothing/types.ts", "name: dto.name,") &&
    includes("src/features/clothing/types.ts", "imageKey: dto.imageKey,") &&
    !includes("src/features/clothing/types.ts", "deleted: false,") &&
    !matches("src/features/clothing/types.ts", /export type ClothingListItem = \{[^}]*deleted:\s*boolean;/),
  "一覧VMに deleted が残っているか、一覧VM変換の項目定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
