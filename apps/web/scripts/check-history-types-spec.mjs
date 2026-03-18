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
  "HT-01",
  "history schema ファイルが src/api/schemas/history.ts に存在する",
  exists("src/api/schemas/history.ts"),
  "src/api/schemas/history.ts が存在しません",
);

check(
  "HT-02",
  "History API DTO に一覧条件と並び順が定義される",
  includes("src/api/schemas/history.ts", 'export type HistoryListOrderDto = "asc" | "desc";') &&
    includes("src/api/schemas/history.ts", "export type HistoryListParamsDto = {") &&
    includes("src/api/schemas/history.ts", "from?: string | null;") &&
    includes("src/api/schemas/history.ts", "to?: string | null;") &&
    includes("src/api/schemas/history.ts", "order?: HistoryListOrderDto;") &&
    includes("src/api/schemas/history.ts", "limit?: number;") &&
    includes("src/api/schemas/history.ts", "cursor?: string | null;"),
  "HistoryListOrderDto / HistoryListParamsDto の定義が不足しています",
);

check(
  "HT-03",
  "History 作成リクエストDTOが templateId と clothingIds の排他的入力を表現する",
  includes("src/api/schemas/history.ts", "export type CreateHistoryRequestDto =") &&
    includes("src/api/schemas/history.ts", "templateId: string;") &&
    includes("src/api/schemas/history.ts", "clothingIds?: never;") &&
    includes("src/api/schemas/history.ts", "templateId?: never;") &&
    includes("src/api/schemas/history.ts", "clothingIds: string[];"),
  "CreateHistoryRequestDto の排他的入力定義が不足しています",
);

check(
  "HT-04",
  "History 一覧/詳細DTOが服同梱データとレスポンスDTOを定義する",
  includes("src/api/schemas/history.ts", '"clothingId" | "name" | "imageKey" | "status"') &&
    includes("src/api/schemas/history.ts", '"clothingId" | "name" | "imageKey" | "status" | "wearCount" | "lastWornAt"') &&
    includes("src/api/schemas/history.ts", "name: string | null;") &&
    includes("src/api/schemas/history.ts", "templateName: string | null;") &&
    includes("src/api/schemas/history.ts", "export type HistoryListResponseDto = {") &&
    includes("src/api/schemas/history.ts", "nextCursor: string | null;") &&
    includes("src/api/schemas/history.ts", "export type HistoryDetailResponseDto = HistoryDto;"),
  "一覧/詳細DTOまたはレスポンスDTO定義が不足しています",
);

check(
  "HT-05",
  "画面表示用VMが features/history/types.ts に定義される",
  exists("src/features/history/types.ts") &&
    includes("src/features/history/types.ts", "export type History = {") &&
    includes("src/features/history/types.ts", "export type HistoryListItem = {") &&
    includes("src/features/history/types.ts", "export type HistoryClothingItem = {") &&
    includes("src/features/history/types.ts", "export type HistoryListClothingItem = {"),
  "src/features/history/types.ts のVM定義が不足しています",
);

check(
  "HT-06",
  "History VM は入力種別を templateName/name の有無から導出する",
  includes("src/features/history/types.ts", 'export type HistoryInputType = "template" | "combination";') &&
    includes("src/features/history/types.ts", "function resolveHistoryInputType(name: string | null): HistoryInputType {") &&
    includes("src/features/history/types.ts", 'return name === null ? "combination" : "template";') &&
    includes("src/features/history/types.ts", "inputType: resolveHistoryInputType(dto.name),") &&
    includes("src/features/history/types.ts", "inputType: resolveHistoryInputType(dto.templateName),"),
  "入力種別導出ロジックが不足しています",
);

check(
  "HT-07",
  "History の同梱服VM（一覧/詳細）で deleted と lastWornAt 正規化を扱える",
  includes("src/features/history/types.ts", 'deleted: dto.status === "DELETED",') &&
    includes("src/features/history/types.ts", "lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,") &&
    includes("src/features/history/types.ts", "clothingItems: dto.clothingItems.map(toHistoryListClothingItem),") &&
    includes("src/features/history/types.ts", "clothingItems: dto.clothingItems.map(toHistoryClothingItem),"),
  "同梱服VM変換または正規化定義が不足しています",
);

check(
  "HT-08",
  "履歴一覧VMがテンプレ名のない組み合わせ入力でも name を null のまま保持する",
  includes("src/features/history/types.ts", "name: string | null;") &&
    matches("src/features/history/types.ts", /name:\s*dto\.name,/),
  "一覧VM の name 保持定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
