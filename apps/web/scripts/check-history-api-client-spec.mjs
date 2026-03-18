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
  "HA-01",
  "History APIクライアントが src/api/endpoints/history.ts に存在する",
  exists("src/api/endpoints/history.ts"),
  "src/api/endpoints/history.ts が存在しません",
);

check(
  "HA-02",
  "History APIクライアントは fetch wrapper（apiClient）経由で実装される",
  includes("src/api/endpoints/history.ts", 'import { apiClient } from "@/api/client";') &&
    includes("src/api/endpoints/history.ts", "apiClient.get<") &&
    includes("src/api/endpoints/history.ts", "apiClient.post<") &&
    includes("src/api/endpoints/history.ts", "apiClient.delete<"),
  "apiClient 経由の実装（GET/POST/DELETE）が不足しています",
);

check(
  "HA-03",
  "MS4-T03で定義された list/detail/create/delete が公開される",
  includes("src/api/endpoints/history.ts", "export function listHistories(") &&
    includes("src/api/endpoints/history.ts", "export function getHistory(") &&
    includes("src/api/endpoints/history.ts", "export function createHistory(") &&
    includes("src/api/endpoints/history.ts", "export function deleteHistory("),
  "History APIクライアント関数の公開が不足しています",
);

check(
  "HA-04",
  "一覧/詳細取得の戻り値がDTO型（HistoryListResponseDto / HistoryDetailResponseDto）で返る",
  includes("src/api/endpoints/history.ts", "Promise<HistoryListResponseDto>") &&
    includes("src/api/endpoints/history.ts", "Promise<HistoryDetailResponseDto>") &&
    includes("src/api/endpoints/history.ts", "apiClient.get<HistoryListResponseDto>") &&
    includes("src/api/endpoints/history.ts", "apiClient.get<HistoryDetailResponseDto>"),
  "一覧または詳細のDTO戻り値型定義が不足しています",
);

check(
  "HA-05",
  "一覧APIは from/to/order/limit/cursor を query として渡せる",
  includes("src/api/schemas/history.ts", "export type HistoryListParamsDto = {") &&
    includes("src/api/schemas/history.ts", "from?: string | null;") &&
    includes("src/api/schemas/history.ts", "to?: string | null;") &&
    includes("src/api/schemas/history.ts", "order?: HistoryListOrderDto;") &&
    includes("src/api/schemas/history.ts", "limit?: number;") &&
    includes("src/api/schemas/history.ts", "cursor?: string | null;") &&
    includes("src/api/endpoints/history.ts", "params: HistoryListParamsDto = {}") &&
    includes("src/api/endpoints/history.ts", "query: params,"),
  "一覧クエリパラメータDTOまたは query 受け渡し実装が不足しています",
);

check(
  "HA-06",
  "作成APIは排他的入力DTO（CreateHistoryRequestDto）をbodyで送る",
  includes("src/api/schemas/history.ts", "export type CreateHistoryRequestDto =") &&
    includes("src/api/endpoints/history.ts", "body: CreateHistoryRequestDto") &&
    includes("src/api/endpoints/history.ts", "apiClient.post<void, CreateHistoryRequestDto>"),
  "作成リクエストDTO定義または body 送信実装が不足しています",
);

check(
  "HA-07",
  "履歴APIパスが /wardrobes/{wardrobeId}/histories(/:historyId) 形式で統一される",
  includes("src/api/endpoints/history.ts", "return `/wardrobes/${wardrobeId}/histories`;") &&
    includes(
      "src/api/endpoints/history.ts",
      "return `${buildHistoryCollectionPath(wardrobeId)}/${historyId}`;",
    ),
  "履歴APIパスの組み立て実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
