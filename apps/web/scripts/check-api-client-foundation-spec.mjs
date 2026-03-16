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
  "AF-01",
  "APIクライアント本体が api/client.ts として存在する",
  exists("src/api/client.ts"),
  "src/api/client.ts が存在しません",
);

check(
  "AF-02",
  "apiClient が NEXT_PUBLIC_API_BASE_URL と timeout 既定値を持つ",
  includes("src/api/client.ts", "NEXT_PUBLIC_API_BASE_URL") &&
    includes("src/api/client.ts", "const DEFAULT_TIMEOUT_MS = 10_000"),
  "baseURL または timeout の既定値設定が不足しています",
);

check(
  "AF-03",
  "GET/POST/PATCH/DELETE の統一インターフェースを公開する",
  includes("src/api/client.ts", 'type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE"') &&
    includes("src/api/client.ts", 'get: (path, options) => request("GET", path, options, resolved)') &&
    includes("src/api/client.ts", 'post: (path, options) => request("POST", path, options, resolved)') &&
    includes("src/api/client.ts", 'patch: (path, options) => request("PATCH", path, options, resolved)') &&
    includes("src/api/client.ts", 'delete: (path, options) => request("DELETE", path, options, resolved)'),
  "HTTPメソッドの統一呼び出し実装が不足しています",
);

check(
  "AF-04",
  "AbortController + setTimeout でタイムアウト制御を実装する",
  includes("src/api/client.ts", "const controller = new AbortController();") &&
    includes("src/api/client.ts", "const timeoutId = setTimeout(() => {") &&
    includes("src/api/client.ts", "controller.abort();") &&
    includes("src/api/client.ts", "clearTimeout(timeoutId);"),
  "タイムアウト制御の実装が不足しています",
);

check(
  "AF-05",
  "レスポンスを text 取得し JSON parse する",
  includes("src/api/client.ts", "const raw = await response.text();") &&
    includes("src/api/client.ts", "return JSON.parse(raw) as unknown;"),
  "JSON parse ロジックが不足しています",
);

check(
  "AF-06",
  "非2xxレスポンスを normalizeApiError で AppError に正規化する",
  includes("src/api/client.ts", "if (!response.ok)") &&
    includes("src/api/client.ts", "throw normalizeApiError(response, payload);"),
  "HTTPエラーの正規化処理が不足しています",
);

check(
  "AF-07",
  "未知エラーとタイムアウトを共通正規化する",
  includes("src/api/client.ts", "throw createTimeoutError(timeoutMs, error);") &&
    includes("src/api/client.ts", 'throw normalizeUnknownError(error, "APIリクエストに失敗しました。");'),
  "未知エラーまたはタイムアウト正規化が不足しています",
);

check(
  "AF-08",
  "AppError 型に code/status/details/requestId が定義される",
  exists("src/lib/error/normalize.ts") &&
    includes("src/lib/error/normalize.ts", "export class AppError extends Error") &&
    includes("src/lib/error/normalize.ts", "readonly code: string;") &&
    includes("src/lib/error/normalize.ts", "readonly status?: number;") &&
    includes("src/lib/error/normalize.ts", "readonly details?: unknown;") &&
    includes("src/lib/error/normalize.ts", "readonly requestId?: string;"),
  "AppError の定義が不足しています",
);

check(
  "AF-09",
  "サーバーの error envelope から code/message/details/requestId を抽出する",
  includes("src/lib/error/normalize.ts", "const envelope = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;") &&
    includes("src/lib/error/normalize.ts", "const code = pickNonEmptyString(envelope?.code) ?? codeFromStatus(response.status);") &&
    includes("src/lib/error/normalize.ts", "const message =") &&
    includes("src/lib/error/normalize.ts", "const details = envelope?.details;") &&
    includes("src/lib/error/normalize.ts", "const requestId = pickNonEmptyString(envelope?.requestId);"),
  "error envelope の抽出実装が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
