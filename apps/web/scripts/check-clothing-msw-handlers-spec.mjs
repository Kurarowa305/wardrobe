import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const failures = [];
let checkCount = 0;
const abs = (relPath) => path.join(webRoot, relPath);
const exists = (relPath) => fs.existsSync(abs(relPath));
const read = (relPath) => fs.readFileSync(abs(relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);
function check(id, description, passed, detail) { checkCount += 1; if (passed) { console.log(`PASS ${id}: ${description}`); return; } failures.push(`FAIL ${id}: ${description}\n  ${detail}`); }
check("CM-01", "Clothing MSW handler が存在する", exists("src/mocks/handlers/clothing.ts"), "handler が存在しません");
check("CM-02", "GET/POST/PATCH/DELETE の CRUD と一覧取得を公開する", includes("src/mocks/handlers/clothing.ts", 'http.get("*/wardrobes/:wardrobeId/clothing"') && includes("src/mocks/handlers/clothing.ts", 'http.get("*/wardrobes/:wardrobeId/clothing/:clothingId"') && includes("src/mocks/handlers/clothing.ts", 'http.post("*/wardrobes/:wardrobeId/clothing"') && includes("src/mocks/handlers/clothing.ts", 'http.patch("*/wardrobes/:wardrobeId/clothing/:clothingId"') && includes("src/mocks/handlers/clothing.ts", 'http.delete("*/wardrobes/:wardrobeId/clothing/:clothingId"'), "CRUD handler 定義が不足しています");
check("CM-03", "一覧 handler が genre/limit/cursor を受け取り nextCursor を返す", includes("src/mocks/handlers/clothing.ts", 'const genreParam = url.searchParams.get("genre");') && includes("src/mocks/handlers/clothing.ts", 'const limit = parseLimit(url.searchParams.get("limit"));') && includes("src/mocks/handlers/clothing.ts", 'const cursor = parseCursor(url.searchParams.get("cursor"));') && includes("src/mocks/handlers/clothing.ts", 'const nextCursor ='), "genre/limit/cursor/nextCursor 実装が不足しています");
check("CM-04", "詳細 handler が存在しない clothingId で 404 を返せる", includes("src/mocks/handlers/clothing.ts", 'const clothing = clothingStore.find((item) => item.clothingId === clothingId);') && includes("src/mocks/handlers/clothing.ts", 'return createNotFoundResponse("clothing");'), "404 応答が不足しています");
check("CM-05", "共通シナリオを適用する", includes("src/mocks/handlers/clothing.ts", 'import { applyMockScenario } from "./scenario";') && includes("src/mocks/handlers/clothing.ts", 'const scenarioResponse = await applyMockScenario(request);'), "applyMockScenario 適用が不足しています");
check("CM-06", "handlers 集約に clothingHandlers が追加される", includes("src/mocks/handlers/index.ts", 'import { clothingHandlers } from "./clothing";') && includes("src/mocks/handlers/index.ts", 'handlers.push(...clothingHandlers);'), "handlers 集約が不足しています");
check("CM-07", "create/update handler が genre を保存する", includes("src/mocks/handlers/clothing.ts", 'genre: payload.genre,') && includes("src/mocks/handlers/clothing.ts", 'if (payload.genre !== undefined) target.genre = payload.genre;'), "genre 保存処理が不足しています");
check("CM-08", "デモ遷移用 wardrobeId を許可する", includes("src/mocks/handlers/clothing.ts", 'DEMO_IDS.wardrobe'), "DEMO_IDS.wardrobe 許可が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
