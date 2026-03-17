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
  "TM-01",
  "Template MSW handler が src/mocks/handlers/template.ts に存在する",
  exists("src/mocks/handlers/template.ts"),
  "src/mocks/handlers/template.ts が存在しません",
);

check(
  "TM-02",
  "Template handler が GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する",
  includes("src/mocks/handlers/template.ts", 'http.get("*/wardrobes/:wardrobeId/templates"') &&
    includes("src/mocks/handlers/template.ts", 'http.get("*/wardrobes/:wardrobeId/templates/:templateId"') &&
    includes("src/mocks/handlers/template.ts", 'http.post("*/wardrobes/:wardrobeId/templates"') &&
    includes("src/mocks/handlers/template.ts", 'http.patch("*/wardrobes/:wardrobeId/templates/:templateId"') &&
    includes("src/mocks/handlers/template.ts", 'http.delete("*/wardrobes/:wardrobeId/templates/:templateId"'),
  "template.ts の CRUD 一覧ハンドラ定義が不足しています",
);

check(
  "TM-03",
  "一覧 handler が limit/cursor を受け取り nextCursor を返す",
  includes("src/mocks/handlers/template.ts", 'const limit = parseLimit(url.searchParams.get("limit"));') &&
    includes("src/mocks/handlers/template.ts", 'const cursor = parseCursor(url.searchParams.get("cursor"));') &&
    includes("src/mocks/handlers/template.ts", "const nextCursor =") &&
    includes("src/mocks/handlers/template.ts", "nextCursor,"),
  "一覧ページング（limit/cursor/nextCursor）の実装が不足しています",
);

check(
  "TM-04",
  "詳細 handler が存在しない templateId で 404 を返せる",
  includes("src/mocks/handlers/template.ts", "const template = templateStore.find((item) => item.templateId === templateId);") &&
    includes("src/mocks/handlers/template.ts", "if (!template) {") &&
    includes("src/mocks/handlers/template.ts", 'return createNotFoundResponse("template");'),
  "存在しないIDに対する 404 応答実装が不足しています",
);

check(
  "TM-05",
  "Template handler が clothingIds を clothingItems に解決して返却する",
  includes("src/mocks/handlers/template.ts", "function resolveClothingItems(clothingIds: string[]):") &&
    includes("src/mocks/handlers/template.ts", "clothingDetailFixtureById[clothingId]") &&
    includes("src/mocks/handlers/template.ts", "clothingItems: template.clothingItems") &&
    includes("src/mocks/handlers/template.ts", "clothingItems: nextClothingItems"),
  "clothingIds から clothingItems への解決実装が不足しています",
);

check(
  "TM-06",
  "Template handler が共通シナリオ（delay/forceError）を適用する",
  includes("src/mocks/handlers/template.ts", 'import { applyMockScenario } from "./scenario";') &&
    includes("src/mocks/handlers/template.ts", "const scenarioResponse = await applyMockScenario(request);") &&
    includes("src/mocks/handlers/template.ts", "if (scenarioResponse) {"),
  "template.ts に applyMockScenario 適用が不足しています",
);

check(
  "TM-07",
  "handlers 集約に templateHandlers が追加される",
  includes("src/mocks/handlers/index.ts", 'import { templateHandlers } from "./template";') &&
    includes("src/mocks/handlers/index.ts", "handlers.push(...templateHandlers);"),
  "src/mocks/handlers/index.ts への templateHandlers 組み込みが不足しています",
);

check(
  "TM-08",
  "Template handler がデモ遷移用 wardrobeId（DEMO_IDS.wardrobe）を許可する",
  includes("src/mocks/handlers/template.ts", 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(
      "src/mocks/handlers/template.ts",
      "return wardrobeId === TEMPLATE_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;",
    ),
  "template.ts の対応 wardrobeId 判定に DEMO_IDS.wardrobe が含まれていません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
