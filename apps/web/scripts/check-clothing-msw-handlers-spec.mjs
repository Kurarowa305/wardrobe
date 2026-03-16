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
  "CM-01",
  "Clothing MSW handler が src/mocks/handlers/clothing.ts に存在する",
  exists("src/mocks/handlers/clothing.ts"),
  "src/mocks/handlers/clothing.ts が存在しません",
);

check(
  "CM-02",
  "Clothing handler が GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する",
  includes("src/mocks/handlers/clothing.ts", 'http.get("*/wardrobes/:wardrobeId/clothing"') &&
    includes("src/mocks/handlers/clothing.ts", 'http.get("*/wardrobes/:wardrobeId/clothing/:clothingId"') &&
    includes("src/mocks/handlers/clothing.ts", 'http.post("*/wardrobes/:wardrobeId/clothing"') &&
    includes("src/mocks/handlers/clothing.ts", 'http.patch("*/wardrobes/:wardrobeId/clothing/:clothingId"') &&
    includes("src/mocks/handlers/clothing.ts", 'http.delete("*/wardrobes/:wardrobeId/clothing/:clothingId"'),
  "clothing.ts の CRUD 一覧ハンドラ定義が不足しています",
);

check(
  "CM-03",
  "一覧 handler が limit/cursor を受け取り nextCursor を返す",
  includes("src/mocks/handlers/clothing.ts", 'const limit = parseLimit(url.searchParams.get("limit"));') &&
    includes("src/mocks/handlers/clothing.ts", 'const cursor = parseCursor(url.searchParams.get("cursor"));') &&
    includes("src/mocks/handlers/clothing.ts", "const nextCursor =") &&
    includes("src/mocks/handlers/clothing.ts", "nextCursor,"),
  "一覧ページング（limit/cursor/nextCursor）の実装が不足しています",
);

check(
  "CM-04",
  "詳細 handler が存在しない clothingId で 404 を返せる",
  includes("src/mocks/handlers/clothing.ts", "const clothing = clothingStore.find((item) => item.clothingId === clothingId);") &&
    includes("src/mocks/handlers/clothing.ts", "if (!clothing) {") &&
    includes("src/mocks/handlers/clothing.ts", 'return createNotFoundResponse("clothing");'),
  "存在しないIDに対する 404 応答実装が不足しています",
);

check(
  "CM-05",
  "Clothing handler が共通シナリオ（delay/forceError）を適用する",
  includes("src/mocks/handlers/clothing.ts", 'import { applyMockScenario } from "./scenario";') &&
    includes("src/mocks/handlers/clothing.ts", "const scenarioResponse = await applyMockScenario(request);") &&
    includes("src/mocks/handlers/clothing.ts", "if (scenarioResponse) {"),
  "clothing.ts に applyMockScenario 適用が不足しています",
);

check(
  "CM-06",
  "handlers 集約に clothingHandlers が追加される",
  includes("src/mocks/handlers/index.ts", 'import { clothingHandlers } from "./clothing";') &&
    includes("src/mocks/handlers/index.ts", "handlers.push(...clothingHandlers);"),
  "src/mocks/handlers/index.ts への clothingHandlers 組み込みが不足しています",
);

check(
  "CM-07",
  "Clothing handler がデモ遷移用 wardrobeId（DEMO_IDS.wardrobe）を許可する",
  includes("src/mocks/handlers/clothing.ts", 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(
      "src/mocks/handlers/clothing.ts",
      "return wardrobeId === CLOTHING_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;",
    ),
  "clothing.ts の対応 wardrobeId 判定に DEMO_IDS.wardrobe が含まれていません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
