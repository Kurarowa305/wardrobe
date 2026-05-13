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
  "CRA-W01",
  "おすすめ服DTOがAPIレスポンス形状を扱う",
  includes("src/api/schemas/clothing.ts", "export type ClothingRecommendationSeasonDto") &&
    includes("src/api/schemas/clothing.ts", "export type ClothingRecommendationResponseDto") &&
    includes("src/api/schemas/clothing.ts", "seasonTagIds: ItemTagIdDto[];") &&
    includes("src/api/schemas/clothing.ts", "tops: ClothingRecommendationItemDto[];") &&
    includes("src/api/schemas/clothing.ts", "bottoms: ClothingRecommendationItemDto[];"),
  "おすすめ服DTOの season / seasonTagIds / tops / bottoms 定義が不足しています",
);

check(
  "CRA-W02",
  "APIクライアントが recommendations endpoint をGETする",
  includes("src/api/endpoints/clothing.ts", "buildClothingRecommendationsPath") &&
    includes("src/api/endpoints/clothing.ts", "recommendations/clothing") &&
    includes("src/api/endpoints/clothing.ts", "export function getClothingRecommendations(") &&
    includes("src/api/endpoints/clothing.ts", "apiClient.get<ClothingRecommendationResponseDto>"),
  "おすすめ服APIクライアント実装が不足しています",
);

check(
  "CRA-W03",
  "query key は clothing wardrobe scope 配下の recommendation key を使う",
  includes("src/api/queryKeys.ts", 'recommendation: (wardrobeId: string) => [...clothingScope(wardrobeId), "recommendation"] as const'),
  "queryKeys.clothing.recommendation が clothing scope 配下にありません",
);

check(
  "CRA-W04",
  "hook が recommendation query key と staleTime を使う",
  includes("src/api/hooks/clothing.ts", "export function useClothingRecommendations(wardrobeId: string)") &&
    includes("src/api/hooks/clothing.ts", "queryKey: queryKeys.clothing.recommendation(wardrobeId)") &&
    includes("src/api/hooks/clothing.ts", "queryFn: () => getClothingRecommendations(wardrobeId)") &&
    includes("src/api/hooks/clothing.ts", "staleTime: CLOTHING_LIST_STALE_TIME_MS") &&
    includes("src/api/hooks/clothing.ts", "select: toClothingRecommendation"),
  "useClothingRecommendations の query key / fetch / staleTime / select が不足しています",
);

check(
  "CRA-W05",
  "服追加/更新/削除後におすすめqueryをinvalidateする",
  includes("src/api/hooks/clothing.ts", "queryKeys.clothing.recommendation(wardrobeId)") &&
    includes("src/api/hooks/clothing.ts", "invalidateClothingListQueries") &&
    includes("src/api/hooks/clothing.ts", "invalidateClothingRelatedQueries"),
  "clothing mutation 後のおすすめ invalidate が不足しています",
);

check(
  "CRA-W06",
  "履歴作成/削除の broad clothing invalidation でおすすめも対象にできる",
  includes("src/api/hooks/history.ts", "queryKeys.clothing.byWardrobe(wardrobeId)") &&
    includes("src/api/queryKeys.ts", 'byWardrobe: (wardrobeId: string) => clothingScope(wardrobeId)') &&
    includes("src/api/queryKeys.ts", 'recommendation: (wardrobeId: string) => [...clothingScope(wardrobeId), "recommendation"] as const'),
  "history mutation の clothing scope invalidation と recommendation key の親子関係が不足しています",
);

check(
  "CRA-W07",
  "テストスクリプトがpackage.jsonとCIに登録される",
  includes("package.json", '"test:clothing-recommendation-api-client": "node scripts/check-clothing-recommendation-api-client-spec.mjs"') &&
    includes(ciYaml, "pnpm --filter web test:clothing-recommendation-api-client"),
  "package.json または CI への登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
