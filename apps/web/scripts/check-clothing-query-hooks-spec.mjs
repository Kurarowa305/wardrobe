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

const target = "src/api/hooks/clothing.ts";

check(
  "CQ-01",
  "Clothing Query hooks が src/api/hooks/clothing.ts に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CQ-02",
  "useClothingList/useClothing が useQuery ラッパとして公開される",
  includes(target, 'import { useQuery } from "@tanstack/react-query";') &&
    includes(target, "export function useClothingList(") &&
    includes(target, "export function useClothing(") &&
    includes(target, "return useQuery({"),
  "useQuery 利用または hooks export が不足しています",
);

check(
  "CQ-03",
  "一覧 hook が queryKeys.clothing.list(params) と listClothings を利用する",
  includes(target, "queryKey: queryKeys.clothing.list(wardrobeId, params),") &&
    includes(target, "queryFn: () => listClothings(wardrobeId, params),"),
  "一覧 hook の queryKey / queryFn 実装が不足しています",
);

check(
  "CQ-04",
  "詳細 hook が queryKeys.clothing.detail(id) と getClothing を利用する",
  includes(target, "queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),") &&
    includes(target, "queryFn: () => getClothing(wardrobeId, clothingId),"),
  "詳細 hook の queryKey / queryFn 実装が不足しています",
);

check(
  "CQ-05",
  "一覧 hook が DTO を ClothingListItem VM に変換し nextCursor を返す",
  includes(target, "select: (response) => ({") &&
    includes(target, "items: response.items.map(toClothingListItem),") &&
    includes(target, "nextCursor: response.nextCursor,"),
  "一覧 hook の VM 変換または nextCursor 引き継ぎが不足しています",
);

check(
  "CQ-06",
  "詳細 hook が DTO を Clothing VM に変換する",
  includes(target, "select: toClothing,"),
  "詳細 hook の toClothing 変換が不足しています",
);

check(
  "CQ-07",
  "服一覧 query に staleTime 方針（60秒）が反映される",
  includes(target, "const CLOTHING_LIST_STALE_TIME_MS = 60_000;") &&
    includes(target, "staleTime: CLOTHING_LIST_STALE_TIME_MS,"),
  "服一覧 query の staleTime 設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
