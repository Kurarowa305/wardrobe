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
  "MS-01",
  "MSWシナリオ共通ユーティリティが存在する",
  exists("src/mocks/handlers/scenario.ts"),
  "src/mocks/handlers/scenario.ts が存在しません",
);

check(
  "MS-02",
  "共通ユーティリティが delay / forceError クエリを解釈する",
  includes("src/mocks/handlers/scenario.ts", 'const DELAY_QUERY_PARAM = "delay"') &&
    includes("src/mocks/handlers/scenario.ts", 'const FORCE_ERROR_QUERY_PARAM = "forceError"') &&
    includes("src/mocks/handlers/scenario.ts", "url.searchParams.get(DELAY_QUERY_PARAM)") &&
    includes("src/mocks/handlers/scenario.ts", "url.searchParams.get(FORCE_ERROR_QUERY_PARAM)"),
  "scenario.ts に delay / forceError のクエリ解釈が不足しています",
);

check(
  "MS-03",
  "delay パラメータでレスポンス遅延を再現できる",
  includes("src/mocks/handlers/scenario.ts", 'import { delay, HttpResponse } from "msw";') &&
    includes("src/mocks/handlers/scenario.ts", "if (delayMs > 0)") &&
    includes("src/mocks/handlers/scenario.ts", "await delay(delayMs);"),
  "scenario.ts に遅延再現ロジックが不足しています",
);

check(
  "MS-04",
  "forceError パラメータで 404 / 500 を強制できる",
  includes("src/mocks/handlers/scenario.ts", "type ForcedErrorStatus = 404 | 500;") &&
    includes("src/mocks/handlers/scenario.ts", 'if (normalized === "404" || normalized === "notfound" || normalized === "not_found")') &&
    includes("src/mocks/handlers/scenario.ts", "return HttpResponse.json(createForcedErrorBody(forcedStatus), {") &&
    includes("src/mocks/handlers/scenario.ts", "status: forcedStatus,"),
  "scenario.ts に forceError の強制エラー実装が不足しています",
);

check(
  "MS-05",
  "health ハンドラが共通シナリオを適用している",
  includes("src/mocks/handlers/health.ts", 'import { applyMockScenario } from "./scenario";') &&
    includes("src/mocks/handlers/health.ts", 'http.get("*/health", async ({ request }) => {') &&
    includes("src/mocks/handlers/health.ts", "const scenarioResponse = await applyMockScenario(request);") &&
    includes("src/mocks/handlers/health.ts", "if (scenarioResponse) {"),
  "health.ts に共通シナリオの適用が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
