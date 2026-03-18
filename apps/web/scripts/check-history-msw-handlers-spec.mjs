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

const target = "src/mocks/handlers/history.ts";

check(
  "HM-01",
  "History MSW handler が src/mocks/handlers/history.ts に存在する",
  exists(target),
  "src/mocks/handlers/history.ts が存在しません",
);

check(
  "HM-02",
  "History handler が GET/POST/DELETE と一覧・詳細取得を公開する",
  includes(target, 'http.get("*/wardrobes/:wardrobeId/histories"') &&
    includes(target, 'http.get("*/wardrobes/:wardrobeId/histories/:historyId"') &&
    includes(target, 'http.post("*/wardrobes/:wardrobeId/histories"') &&
    includes(target, 'http.delete("*/wardrobes/:wardrobeId/histories/:historyId"'),
  "history.ts の一覧/詳細/作成/削除ハンドラ定義が不足しています",
);

check(
  "HM-03",
  "一覧 handler が from/to/order/limit/cursor を解釈し nextCursor を返す",
  includes(target, 'const order = parseOrder(url.searchParams.get("order"));') &&
    includes(target, 'const limit = parseLimit(url.searchParams.get("limit"));') &&
    includes(target, 'const cursor = parseCursor(url.searchParams.get("cursor"));') &&
    includes(target, 'const from = parseDate(url.searchParams.get("from"));') &&
    includes(target, 'const to = parseDate(url.searchParams.get("to"));') &&
    includes(target, "const nextCursor = nextOffset < items.length ? encodeCursor(nextOffset) : null;") &&
    includes(target, "nextCursor,"),
  "一覧の条件解釈またはページング実装が不足しています",
);

check(
  "HM-04",
  "一覧 handler が日付形式不正・範囲逆転・不正カーソルを 400 で再現できる",
  includes(target, 'return createErrorResponse(400, "VALIDATION_ERROR", "from must be yyyymmdd");') &&
    includes(target, 'return createErrorResponse(400, "VALIDATION_ERROR", "to must be yyyymmdd");') &&
    includes(target, 'return createErrorResponse(400, "VALIDATION_ERROR", "from must be less than or equal to to");') &&
    includes(target, 'return createErrorResponse(400, "INVALID_CURSOR", "cursor is invalid");') &&
    includes(target, 'return createErrorResponse(400, "INVALID_CURSOR", "cursor is out of range");'),
  "バリデーションエラーまたはカーソルエラーの再現実装が不足しています",
);

check(
  "HM-05",
  "詳細・削除 handler が存在しない historyId で 404 を返し、削除は物理削除する",
  includes(target, 'const history = historyStore.find((item) => item.historyId === historyId);') &&
    includes(target, 'const historyIndex = historyStore.findIndex((item) => item.historyId === historyId);') &&
    includes(target, 'return createNotFoundResponse("history");') &&
    includes(target, 'historyStore = historyStore.filter((history) => history.historyId !== historyId);'),
  "historyId の 404 応答または物理削除実装が不足しています",
);

check(
  "HM-06",
  "作成 handler が templateId / clothingIds の両入力を fixture から解決する",
  includes(target, 'import { templateDetailFixtureById } from "@/mocks/fixtures/template";') &&
    includes(target, 'const template = templateDetailFixtureById[payload.templateId];') &&
    includes(target, 'const clothingItems = resolveClothingItems(payload.clothingIds);') &&
    includes(target, 'templateName: template.name,') &&
    includes(target, 'templateName: null,'),
  "作成時の template/clothing 解決実装が不足しています",
);

check(
  "HM-07",
  "History handler が共通シナリオ（delay/forceError）を適用する",
  includes(target, 'import { applyMockScenario } from "./scenario";') &&
    includes(target, 'const scenarioResponse = await applyMockScenario(request);') &&
    includes(target, 'if (scenarioResponse) {'),
  "history.ts に applyMockScenario 適用が不足しています",
);

check(
  "HM-08",
  "History handler がデモ遷移用 wardrobeId（DEMO_IDS.wardrobe）を許可し、handlers 集約へ追加される",
  includes(target, 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(target, 'return wardrobeId === HISTORY_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;') &&
    includes("src/mocks/handlers/index.ts", 'import { historyHandlers } from "./history";') &&
    includes("src/mocks/handlers/index.ts", 'handlers.push(...historyHandlers);'),
  "historyHandlers の wardrobeId 対応または handlers 集約が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
