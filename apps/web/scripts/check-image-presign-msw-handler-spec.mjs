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
  "IPM-01",
  "presign MSW handler が src/mocks/handlers/image.ts に存在する",
  exists("src/mocks/handlers/image.ts"),
  "src/mocks/handlers/image.ts が存在しません",
);

check(
  "IPM-02",
  "presign handler が POST /wardrobes/:wardrobeId/images/presign を公開する",
  includes("src/mocks/handlers/image.ts", 'http.post("*/wardrobes/:wardrobeId/images/presign"'),
  "images/presign の POST handler 定義が不足しています",
);

check(
  "IPM-03",
  "presign handler が共通シナリオ（delay/forceError）を適用する",
  includes("src/mocks/handlers/image.ts", 'import { applyMockScenario } from "./scenario";') &&
    includes("src/mocks/handlers/image.ts", "const scenarioResponse = await applyMockScenario(request);") &&
    includes("src/mocks/handlers/image.ts", "if (scenarioResponse) {"),
  "image.ts に applyMockScenario 適用が不足しています",
);

check(
  "IPM-04",
  "presign handler が入力不正時に 400 VALIDATION_ERROR を返せる",
  includes("src/mocks/handlers/image.ts", "const payload = parsePresignRequest(body);") &&
    includes("src/mocks/handlers/image.ts", 'return createErrorResponse(400, "VALIDATION_ERROR", "request body is invalid");') &&
    includes("src/mocks/handlers/image.ts", "const extension = payload.extension ?? inferExtensionFromContentType(payload.contentType);") &&
    includes("src/mocks/handlers/image.ts", 'return createErrorResponse(400, "VALIDATION_ERROR", "extension is invalid");'),
  "入力バリデーション由来の 400 応答実装が不足しています",
);

check(
  "IPM-05",
  "成功時の imageKey が連番と時刻を含むユニーク形式で生成される",
  includes("src/mocks/handlers/image.ts", "let mockImageSequence = 1;") &&
    includes("src/mocks/handlers/image.ts", "mockImageSequence += 1;") &&
    includes("src/mocks/handlers/image.ts", "Date.now()"),
  "imageKey のユニーク生成ロジックが不足しています",
);

check(
  "IPM-06",
  "成功レスポンスに imageKey/uploadUrl/method/expiresAt を含む",
  includes("src/mocks/handlers/image.ts", "return HttpResponse.json<GetPresignedUrlResponseDto>({") &&
    includes("src/mocks/handlers/image.ts", "imageKey,") &&
    includes("src/mocks/handlers/image.ts", "uploadUrl: buildUploadUrl(imageKey),") &&
    includes("src/mocks/handlers/image.ts", 'method: "PUT",') &&
    includes("src/mocks/handlers/image.ts", "expiresAt: buildExpiresAt(),"),
  "presign 成功レスポンスの必須項目が不足しています",
);

check(
  "IPM-07",
  "presign handler が fixture用ID と DEMO_IDS.wardrobe を受け付ける",
  includes("src/mocks/handlers/image.ts", 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes("src/mocks/handlers/image.ts", 'import { CLOTHING_FIXTURE_WARDROBE_ID } from "@/mocks/fixtures/clothing";') &&
    includes(
      "src/mocks/handlers/image.ts",
      "return wardrobeId === CLOTHING_FIXTURE_WARDROBE_ID || wardrobeId === DEMO_IDS.wardrobe;",
    ),
  "対応 wardrobeId 判定に fixture ID / DEMO_IDS.wardrobe が含まれていません",
);

check(
  "IPM-08",
  "handlers 集約に imagePresignHandlers が追加される",
  includes("src/mocks/handlers/index.ts", 'import { imagePresignHandlers } from "./image";') &&
    includes("src/mocks/handlers/index.ts", "handlers.push(...imagePresignHandlers);"),
  "src/mocks/handlers/index.ts への imagePresignHandlers 組み込みが不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
