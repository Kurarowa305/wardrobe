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

const target = "src/api/hooks/history.ts";

check(
  "HMH-01",
  "History Query / Mutation hooks が src/api/hooks/history.ts に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "HMH-02",
  "useHistoryList/useRecentHistories/useHistory が useQuery ラッパとして公開される",
  includes(target, 'import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";') &&
    includes(target, "export function useHistoryList(") &&
    includes(target, "export function useRecentHistories(") &&
    includes(target, "export function useHistory(") &&
    includes(target, "return useQuery({"),
  "history query hooks の export または useQuery 利用が不足しています",
);

check(
  "HMH-03",
  "一覧 hook が queryKeys.history.list(params) と listHistories を利用し VM 変換する",
  includes(target, "queryKey: queryKeys.history.list(wardrobeId, params),") &&
    includes(target, "queryFn: () => listHistories(wardrobeId, params),") &&
    includes(target, "items: response.items.map(toHistoryListItem),") &&
    includes(target, "nextCursor: response.nextCursor,"),
  "一覧 hook の queryKey / queryFn / VM 変換のいずれかが不足しています",
);

check(
  "HMH-04",
  "recent hook が desc + limit 指定で useHistoryList を再利用する",
  includes(target, "return useHistoryList(wardrobeId, {") &&
    includes(target, 'order: "desc",') &&
    includes(target, "limit,") &&
    includes(target, "const RECENT_HISTORY_LIMIT = 5;"),
  "recent histories hook の再利用実装または既定件数が不足しています",
);

check(
  "HMH-05",
  "詳細 hook が queryKeys.history.detail(id) と getHistory を利用し VM 変換する",
  includes(target, "queryKey: queryKeys.history.detail(wardrobeId, historyId),") &&
    includes(target, "queryFn: () => getHistory(wardrobeId, historyId),") &&
    includes(target, "select: toHistory,"),
  "詳細 hook の queryKey / queryFn / VM 変換のいずれかが不足しています",
);

check(
  "HMH-06",
  "useCreateHistoryMutation/useDeleteHistoryMutation が useMutation で公開される",
  includes(target, "export function useCreateHistoryMutation(") &&
    includes(target, "export function useDeleteHistoryMutation(") &&
    includes(target, "return useMutation({"),
  "history mutation hooks の export または useMutation 利用が不足しています",
);

check(
  "HMH-07",
  "create/delete mutation が history/clothing/template を invalidate する",
  includes(target, "mutationFn: (body: CreateHistoryRequestDto) => createHistory(wardrobeId, body),") &&
    includes(target, "mutationFn: () => deleteHistory(wardrobeId, historyId),") &&
    includes(target, "await invalidateHistoryQueries(queryClient, wardrobeId);") &&
    includes(target, "queryKey: queryKeys.history.byWardrobe(wardrobeId),") &&
    includes(target, "queryKey: queryKeys.clothing.byWardrobe(wardrobeId),") &&
    includes(target, "queryKey: queryKeys.template.byWardrobe(wardrobeId),"),
  "mutation の API 呼び出しまたは波及 invalidate 実装が不足しています",
);

check(
  "HMH-08",
  "delete mutation が history detail も invalidate する",
  includes(target, "await Promise.all([") &&
    includes(target, "invalidateHistoryDetailQuery(queryClient, { wardrobeId, historyId }),") &&
    includes(target, "queryKey: queryKeys.history.detail(wardrobeId, historyId),"),
  "delete 後の history detail invalidate 実装が不足しています",
);

check(
  "HMH-09",
  "履歴一覧 query に staleTime 方針（60秒）が反映される",
  includes(target, "const HISTORY_LIST_STALE_TIME_MS = 60_000;") &&
    includes(target, "staleTime: HISTORY_LIST_STALE_TIME_MS,"),
  "履歴一覧 query の staleTime 設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
