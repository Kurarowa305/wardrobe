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

const target = "src/api/hooks/template.ts";

check(
  "TMH-01",
  "Template Query / Mutation hooks が src/api/hooks/template.ts に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "TMH-02",
  "useTemplateList/useTemplate が useQuery ラッパとして公開される",
  includes(target, 'import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";') &&
    includes(target, "export function useTemplateList(") &&
    includes(target, "export function useTemplate(") &&
    includes(target, "return useQuery({"),
  "useQuery 利用または template query hooks export が不足しています",
);

check(
  "TMH-03",
  "一覧 hook が queryKeys.template.list(params) と listTemplates を利用し VM 変換する",
  includes(target, "queryKey: queryKeys.template.list(wardrobeId, params),") &&
    includes(target, "queryFn: () => listTemplates(wardrobeId, params),") &&
    includes(target, "items: response.items.map(toTemplateListItem),") &&
    includes(target, "nextCursor: response.nextCursor,"),
  "一覧 hook の queryKey / queryFn / VM 変換のいずれかが不足しています",
);

check(
  "TMH-04",
  "詳細 hook が queryKeys.template.detail(id) と getTemplate を利用し VM 変換する",
  includes(target, "queryKey: queryKeys.template.detail(wardrobeId, templateId),") &&
    includes(target, "queryFn: () => getTemplate(wardrobeId, templateId),") &&
    includes(target, "select: toTemplate,"),
  "詳細 hook の queryKey / queryFn / VM 変換のいずれかが不足しています",
);

check(
  "TMH-05",
  "useCreateTemplateMutation/useUpdateTemplateMutation/useDeleteTemplateMutation が公開される",
  includes(target, "export function useCreateTemplateMutation(") &&
    includes(target, "export function useUpdateTemplateMutation(") &&
    includes(target, "export function useDeleteTemplateMutation(") &&
    includes(target, "return useMutation({"),
  "template mutation hooks の export または useMutation 利用が不足しています",
);

check(
  "TMH-06",
  "create mutation が createTemplate を呼び、成功時に template lists を invalidate する",
  includes(target, "mutationFn: (body: CreateTemplateRequestDto) => createTemplate(wardrobeId, body),") &&
    includes(target, "await invalidateTemplateListQueries(queryClient, wardrobeId);") &&
    includes(target, "queryKey: queryKeys.template.lists(wardrobeId),"),
  "create mutation の mutationFn または invalidate 実装が不足しています",
);

check(
  "TMH-07",
  "update/delete mutation が template detail/list と history(byWardrobe) を invalidate する",
  includes(target, "mutationFn: (body: UpdateTemplateRequestDto) => updateTemplate(wardrobeId, templateId, body),") &&
    includes(target, "mutationFn: () => deleteTemplate(wardrobeId, templateId),") &&
    includes(target, "await invalidateTemplateRelatedQueries(queryClient, { wardrobeId, templateId });") &&
    includes(target, "queryKey: queryKeys.template.detail(wardrobeId, templateId),") &&
    includes(target, "queryKey: queryKeys.template.lists(wardrobeId),") &&
    includes(target, "queryKey: queryKeys.history.byWardrobe(wardrobeId),"),
  "update/delete mutation の波及 invalidate 実装が不足しています",
);

check(
  "TMH-08",
  "テンプレ一覧 query に staleTime 方針（60秒）が反映される",
  includes(target, "const TEMPLATE_LIST_STALE_TIME_MS = 60_000;") &&
    includes(target, "staleTime: TEMPLATE_LIST_STALE_TIME_MS,"),
  "テンプレ一覧 query の staleTime 設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
