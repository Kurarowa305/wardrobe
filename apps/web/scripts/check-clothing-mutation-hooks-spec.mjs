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
  "CMH-01",
  "Clothing Mutation hooks が src/api/hooks/clothing.ts に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CMH-02",
  "useCreateClothingMutation/useUpdateClothingMutation/useDeleteClothingMutation が useMutation ラッパとして公開される",
  includes(target, 'import { useMutation, useQueryClient } from "@tanstack/react-query";') &&
    includes(target, "export function useCreateClothingMutation(") &&
    includes(target, "export function useUpdateClothingMutation(") &&
    includes(target, "export function useDeleteClothingMutation(") &&
    includes(target, "return useMutation({"),
  "useMutation 利用または mutation hooks export が不足しています",
);

check(
  "CMH-03",
  "create mutation が createClothing を呼び、成功時に clothing lists を invalidate する",
  includes(target, "mutationFn: (body: CreateClothingRequestDto) => createClothing(wardrobeId, body),") &&
    includes(target, "await invalidateClothingListQueries(queryClient, wardrobeId);") &&
    includes(target, "queryKey: queryKeys.clothing.lists(wardrobeId),"),
  "create mutation の mutationFn または invalidate 実装が不足しています",
);

check(
  "CMH-04",
  "update mutation が updateClothing を呼び、detail(id) と関連一覧を invalidate する",
  includes(
    target,
    "mutationFn: (body: UpdateClothingRequestDto) => updateClothing(wardrobeId, clothingId, body),",
  ) &&
    includes(target, "await invalidateClothingRelatedQueries(queryClient, { wardrobeId, clothingId });") &&
    includes(target, "queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),") &&
    includes(target, "queryKey: queryKeys.clothing.lists(wardrobeId),"),
  "update mutation の mutationFn または detail/list invalidate 実装が不足しています",
);

check(
  "CMH-05",
  "delete mutation が deleteClothing を呼び、一覧除外/詳細再取得のため detail(id) と関連一覧を invalidate する",
  includes(target, "mutationFn: () => deleteClothing(wardrobeId, clothingId),") &&
    includes(target, "await invalidateClothingRelatedQueries(queryClient, { wardrobeId, clothingId });") &&
    includes(target, "queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),") &&
    includes(target, "queryKey: queryKeys.clothing.lists(wardrobeId),"),
  "delete mutation の mutationFn または detail/list invalidate 実装が不足しています",
);

check(
  "CMH-06",
  "服編集/削除で波及先（template/history）も wardrobe 単位で invalidate する",
  includes(target, "queryKey: queryKeys.template.byWardrobe(wardrobeId),") &&
    includes(target, "queryKey: queryKeys.history.byWardrobe(wardrobeId),"),
  "template/history への invalidate 実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
