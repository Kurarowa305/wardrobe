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

const homeSource = read("src/components/app/screens/HomeTabScreen.tsx");
const addRecordIndex = homeSource.indexOf("HOME_STRINGS.actions.addRecord");
const recommendationsIndex = homeSource.indexOf("home-clothing-recommendations-heading");
const recentHistoriesIndex = homeSource.indexOf("home-recent-histories-heading");

check(
  "HCR-01",
  "ホーム画面が useClothingRecommendations hook を利用する",
  includes("src/components/app/screens/HomeTabScreen.tsx", 'import { useClothingRecommendations } from "@/api/hooks/clothing";') &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "const clothingRecommendationsQuery = useClothingRecommendations(wardrobeId);"),
  "HomeTabScreen でおすすめ服hookの利用が不足しています",
);

check(
  "HCR-02",
  "おすすめ服セクションは記録ボタン直下、直近履歴より前に表示される",
  addRecordIndex >= 0 &&
    recommendationsIndex > addRecordIndex &&
    recentHistoriesIndex > recommendationsIndex,
  "おすすめ服セクションの表示位置が期待と異なります",
);

check(
  "HCR-03",
  "loading / error / empty / list の表示分岐を持つ",
  includes("src/components/app/screens/HomeTabScreen.tsx", "loadingClothingRecommendations") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "errorClothingRecommendations") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "emptyClothingRecommendations") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "clothingRecommendationsQuery.data.items.tops.length > 0"),
  "おすすめ服セクションの表示分岐が不足しています",
);

check(
  "HCR-04",
  "トップス/ボトムスをジャンル別に表示する",
  includes("src/components/app/screens/HomeTabScreen.tsx", '(["tops", "bottoms"] as const).map((genre) =>') &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "CLOTHING_GENRE_LABELS[genre]") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "ClothingGenreIcon genre={genre}"),
  "ジャンル別表示が不足しています",
);

check(
  "HCR-05",
  "itemカードは服一覧と共通のサムネイル + 服名カードを使い、服詳細リンクを持つ",
  includes("src/components/app/screens/HomeTabScreen.tsx", "ClothingListCard") &&
    includes("src/components/app/screens/HomeTabScreen.tsx", "ROUTES.clothingDetail(wardrobeId, item.clothingId)") &&
    includes("src/components/app/screens/ClothingListCard.tsx", "resolveImageUrl(item.imageKey)") &&
    includes("src/components/app/screens/ClothingListCard.tsx", "COMMON_STRINGS.placeholders.noImage") &&
    includes("src/components/app/screens/ClothingListCard.tsx", "{item.name}"),
  "共通カード、サムネイル/no image、服詳細リンクのいずれかが不足しています",
);

check(
  "HCR-06",
  "ホームおすすめカードにタグ/最終着用日/着用回数を表示しない",
  !homeSource.includes("ItemTagChips") &&
    !homeSource.includes("lastWornAt") &&
    !homeSource.includes("wearCount"),
  "ホームおすすめに不要なタグ/最終着用日/着用回数表示が含まれています",
);

check(
  "HCR-07",
  "服一覧も共通カードを利用する",
  includes("src/components/app/screens/ClothingGenreSection.tsx", "ClothingListCard") &&
    includes("src/components/app/screens/ClothingGenreSection.tsx", "selectable={selectable}") &&
    includes("src/components/app/screens/ClothingGenreSection.tsx", "href={hrefResolver?.(item)}"),
  "服一覧側の共通カード利用が不足しています",
);

check(
  "HCR-08",
  "テストスクリプトがpackage.jsonとCIに登録される",
  includes("package.json", '"test:home-clothing-recommendations": "node scripts/check-home-clothing-recommendations-spec.mjs"') &&
    includes(ciYaml, "pnpm --filter web test:home-clothing-recommendations"),
  "package.json または CI への登録が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
