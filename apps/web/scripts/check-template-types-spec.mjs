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
  "TT-01",
  "template schema ファイルが src/api/schemas/template.ts に存在する",
  exists("src/api/schemas/template.ts"),
  "src/api/schemas/template.ts が存在しません",
);

check(
  "TT-02",
  "Template API DTO に status / order / params が定義される",
  includes("src/api/schemas/template.ts", 'export type TemplateStatusDto = "ACTIVE" | "DELETED";') &&
    includes("src/api/schemas/template.ts", 'export type TemplateListOrderDto = "asc" | "desc";') &&
    includes("src/api/schemas/template.ts", "export type TemplateListParamsDto = {") &&
    includes("src/api/schemas/template.ts", "order?: TemplateListOrderDto;") &&
    includes("src/api/schemas/template.ts", "limit?: number;") &&
    includes("src/api/schemas/template.ts", "cursor?: string | null;"),
  "TemplateStatusDto / TemplateListOrderDto / TemplateListParamsDto の定義が不足しています",
);

check(
  "TT-03",
  "Template 作成/更新リクエストDTOが clothingIds を配列で受ける",
  includes("src/api/schemas/template.ts", "export type CreateTemplateRequestDto = {") &&
    includes("src/api/schemas/template.ts", "export type UpdateTemplateRequestDto = {") &&
    includes("src/api/schemas/template.ts", "clothingIds: string[];") &&
    includes("src/api/schemas/template.ts", "clothingIds?: string[];"),
  "CreateTemplateRequestDto / UpdateTemplateRequestDto の clothingIds 定義が不足しています",
);

check(
  "TT-04",
  "Template 一覧/詳細DTOが clothingItems の同梱データ配列を定義する",
  includes("src/api/schemas/template.ts", "export type TemplateListClothingItemDto = Pick<ClothingDto,") &&
    includes("src/api/schemas/template.ts", 'export type TemplateDetailClothingItemDto = ClothingDto;') &&
    includes("src/api/schemas/template.ts", "clothingItems: TemplateListClothingItemDto[];") &&
    includes("src/api/schemas/template.ts", "clothingItems: TemplateDetailClothingItemDto[];") &&
    includes("src/api/schemas/template.ts", "export type TemplateListResponseDto = {") &&
    includes("src/api/schemas/template.ts", "nextCursor: string | null;"),
  "Template 一覧/詳細DTOの clothingItems またはレスポンスDTO定義が不足しています",
);

check(
  "TT-05",
  "画面表示用VMが features/template/types.ts に定義される",
  exists("src/features/template/types.ts") &&
    includes("src/features/template/types.ts", "export type Template = {") &&
    includes("src/features/template/types.ts", "export type TemplateListItem = {") &&
    includes("src/features/template/types.ts", "export type TemplateClothingItem = {") &&
    includes("src/features/template/types.ts", "export type TemplateListClothingItem = {"),
  "src/features/template/types.ts のVM定義が不足しています",
);

check(
  "TT-06",
  "Template VM は status を deleted に変換し、lastWornAt=0 を null に正規化する",
  includes("src/features/template/types.ts", "export function toTemplate(dto: TemplateDetailResponseDto): Template {") &&
    includes("src/features/template/types.ts", 'deleted: dto.status === "DELETED",') &&
    includes("src/features/template/types.ts", "lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,"),
  "Template 詳細VMの deleted 変換または lastWornAt 正規化が不足しています",
);

check(
  "TT-07",
  "Template の同梱服VM（一覧/詳細）で clothingItems 配列を変換できる",
  includes("src/features/template/types.ts", "clothingItems: dto.clothingItems.map(toTemplateListClothingItem),") &&
    includes("src/features/template/types.ts", "clothingItems: dto.clothingItems.map(toTemplateClothingItem),") &&
    includes("src/features/template/types.ts", 'deleted: dto.status === "DELETED",'),
  "clothingItems の一覧/詳細変換または削除済みフラグ変換が不足しています",
);

check(
  "TT-08",
  "Template 詳細の同梱服VMで lastWornAt を null 許容に変換する",
  includes("src/features/template/types.ts", "export function toTemplateClothingItem(dto: TemplateDetailClothingItemDto): TemplateClothingItem {") &&
    includes("src/features/template/types.ts", "lastWornAt: number | null;") &&
    includes("src/features/template/types.ts", "lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,"),
  "Template 詳細同梱服の lastWornAt 正規化定義が不足しています",
);

check(
  "TT-09",
  "Template 一覧VMは clothingItems の deleted 判定に status を使う",
  includes("src/features/template/types.ts", "export function toTemplateListClothingItem(") &&
    includes("src/features/template/types.ts", "dto: TemplateListClothingItemDto,") &&
    matches("src/features/template/types.ts", /deleted:\s*dto\.status\s*===\s*"DELETED"/),
  "Template 一覧同梱服の deleted 判定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
