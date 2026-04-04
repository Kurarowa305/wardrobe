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

const target = "src/components/app/screens/ClothingDetailScreen.tsx";
const detailPageTarget = "src/app/clothings/detail/page.tsx";
const editPageTarget = "src/app/clothings/edit/page.tsx";
const stringsTarget = "src/features/clothing/strings.ts";
const routesTarget = "src/constants/routes.ts";

check(
  "CDS-01",
  "服詳細画面が src/components/app/screens/ClothingDetailScreen.tsx に存在する",
  exists(target),
  `${target} が存在しません`,
);

check(
  "CDS-02",
  "服詳細画面が useClothing を利用してデータ取得する",
  includes(target, '"use client";') &&
    includes(target, "@/api/hooks/clothing") &&
    includes(target, "const clothingQuery = useClothing(wardrobeId, clothingId);"),
  "useClothing を使った詳細データ取得実装が不足しています",
);

check(
  "CDS-03",
  "詳細画面に画像・服名・着た回数・最後に着た日を表示し、resolveImageUrl と no image フォールバックを利用する",
  includes(target, 'import { resolveImageUrl } from "@/features/clothing/imageUrl";') &&
    includes(target, "const imageUrl = resolveImageUrl(clothingQuery.data?.imageKey);") &&
    includes(target, "<img") &&
    includes(target, "COMMON_STRINGS.placeholders.noImage") &&
    includes(target, "clothingQuery.data.name") &&
    includes(target, "CLOTHING_STRINGS.detail.labels.wearCount") &&
    includes(target, "clothingQuery.data.wearCount") &&
    includes(target, "CLOTHING_STRINGS.detail.labels.lastWornAt") &&
    includes(target, "formatLastWornDate(clothingQuery.data.lastWornAt, CLOTHING_STRINGS.detail.messages.neverWorn)"),
  "画像・服名・曜日付き着用情報表示、resolveImageUrl/no image フォールバック実装が不足しています",
);

check(
  "CDS-04",
  "詳細取得エラー時に 404 とそれ以外で表示文言を切り分ける",
  includes(target, "isAppError(error) && error.status === 404") &&
    includes(target, "CLOTHING_STRINGS.detail.messages.notFound") &&
    includes(target, "CLOTHING_STRINGS.detail.messages.error"),
  "404/500 系のエラー表示分岐が不足しています",
);

check(
  "CDS-05",
  "削除済み服では「削除済み」表記を表示する",
  includes(target, "clothingQuery.data.deleted ? (") &&
    includes(target, "CLOTHING_STRINGS.detail.messages.deleted"),
  "削除済み表示の実装が不足しています",
);

check(
  "CDS-06",
  "服詳細画面向け文言が clothing strings に定義される",
  includes(stringsTarget, 'wearCount: "着た回数"') &&
    includes(stringsTarget, 'lastWornAt: "最後に着た日"') &&
    includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'error: "服詳細の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'notFound: "服が見つかりませんでした。"') &&
    includes(stringsTarget, 'deleted: "削除済み"') &&
    includes(stringsTarget, 'neverWorn: "未着用"'),
  "features/clothing/strings.ts に詳細画面文言の定義が不足しています",
);

check(
  "CDS-07",
  "服詳細/編集ページが query パラメータから wardrobeId/clothingId を解決して screen へ渡す",
  includes(detailPageTarget, 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(detailPageTarget, "useClothingRouteIdsFromQuery") &&
    includes(detailPageTarget, "const { wardrobeId, clothingId } = useClothingRouteIdsFromQuery();") &&
    includes(detailPageTarget, "return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;") &&
    includes(detailPageTarget, "<Suspense") &&
    includes(
      detailPageTarget,
      "fallback={<ClothingDetailScreen wardrobeId={DEMO_IDS.wardrobe} clothingId={DEMO_IDS.clothing} />}",
    ) &&
    includes(editPageTarget, 'import { DEMO_IDS } from "@/constants/routes";') &&
    includes(editPageTarget, "useClothingRouteIdsFromQuery") &&
    includes(editPageTarget, "const { wardrobeId, clothingId } = useClothingRouteIdsFromQuery();") &&
    includes(editPageTarget, "return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;") &&
    includes(editPageTarget, "<Suspense"),
  "detail/edit ページの query 解決または ClothingScreen への受け渡しが不足しています",
);

check(
  "CDS-08",
  "服詳細/編集URLが query パラメータ形式（/clothings/detail, /clothings/edit）で生成される",
  includes(routesTarget, 'buildPathWithQuery("/clothings/detail", {') &&
    includes(routesTarget, 'buildPathWithQuery("/clothings/edit", {') &&
    includes(routesTarget, "[ROUTE_QUERY_KEYS.wardrobeId]: wardrobeId") &&
    includes(routesTarget, "[ROUTE_QUERY_KEYS.clothingId]: clothingId"),
  "ROUTES.clothingDetail / ROUTES.clothingEdit の query 形式生成が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
