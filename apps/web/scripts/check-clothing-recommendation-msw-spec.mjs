import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const ciYaml = path.resolve(webRoot, "..", "..", ".github", "workflows", "ci.yml");
const failures = [];
let checkCount = 0;

const read = (relPath) => fs.readFileSync(path.isAbsolute(relPath) ? relPath : path.join(webRoot, relPath), "utf8");
const includes = (relPath, expected) => read(relPath).includes(expected);

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

check(
  "CRM-01",
  "MSW handler が recommendations endpoint を持つ",
  includes("src/mocks/handlers/clothing.ts", 'http.get("*/wardrobes/:wardrobeId/recommendations/clothing"') &&
    includes("src/mocks/handlers/clothing.ts", "HttpResponse.json<ClothingRecommendationResponseDto>"),
  "recommendations endpoint のMSW handlerが不足しています",
);

check(
  "CRM-02",
  "MSW handler がJST基準の季節と season:all を扱う",
  includes("src/mocks/handlers/clothing.ts", "JST_OFFSET_MS") &&
    includes("src/mocks/handlers/clothing.ts", "getCurrentRecommendationSeason") &&
    includes("src/mocks/handlers/clothing.ts", 'return [`season:${season}`, "season:all"] as ItemTagIdDto[];'),
  "JST季節判定または season:all の扱いが不足しています",
);

check(
  "CRM-03",
  "MSW handler がACTIVE / genre / tagIds で抽出する",
  includes("src/mocks/handlers/clothing.ts", 'clothing.status === "ACTIVE"') &&
    includes("src/mocks/handlers/clothing.ts", "clothing.genre === genre") &&
    includes("src/mocks/handlers/clothing.ts", "tagIds.some((tagId) => targetTags.has(tagId))"),
  "ACTIVE / genre / tagIds の抽出条件が不足しています",
);

check(
  "CRM-04",
  "MSW handler が lastWornAt 古い順で各ジャンル2件を返す",
  includes("src/mocks/handlers/clothing.ts", "left.lastWornAt - right.lastWornAt") &&
    includes("src/mocks/handlers/clothing.ts", "RECOMMENDATION_LIMIT_PER_GENRE = 2") &&
    includes("src/mocks/handlers/clothing.ts", ".slice(0, RECOMMENDATION_LIMIT_PER_GENRE)") &&
    includes("src/mocks/handlers/clothing.ts", 'tops: buildRecommendationItems("tops", seasonTagIds)') &&
    includes("src/mocks/handlers/clothing.ts", 'bottoms: buildRecommendationItems("bottoms", seasonTagIds)'),
  "lastWornAt順または各ジャンル2件のレスポンス生成が不足しています",
);

check(
  "CRM-05",
  "テストスクリプトがpackage.jsonとCIに登録される",
  includes("package.json", '"test:clothing-recommendation-msw": "node scripts/check-clothing-recommendation-msw-spec.mjs"') &&
    includes(ciYaml, "pnpm --filter web test:clothing-recommendation-msw"),
  "package.json または CI への登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
