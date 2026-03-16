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
const detailPageTarget = "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/page.tsx";
const editPageTarget = "src/app/wardrobes/[wardrobeId]/(stack)/clothings/[clothingId]/edit/page.tsx";
const stringsTarget = "src/features/clothing/strings.ts";

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
    includes(target, 'import { useClothing } from "@/api/hooks/clothing";') &&
    includes(target, "const clothingQuery = useClothing(wardrobeId, clothingId);"),
  "useClothing を使った詳細データ取得実装が不足しています",
);

check(
  "CDS-03",
  "詳細画面に画像と服名を表示し、画像未設定時は no image を表示する",
  includes(target, "clothingQuery.data.imageKey ? \"image\" : COMMON_STRINGS.placeholders.noImage") &&
    includes(target, "clothingQuery.data.name"),
  "画像または服名表示、no image フォールバック実装が不足しています",
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
  includes(stringsTarget, 'loading: "読み込み中..."') &&
    includes(stringsTarget, 'error: "服詳細の読み込みに失敗しました。"') &&
    includes(stringsTarget, 'notFound: "服が見つかりませんでした。"') &&
    includes(stringsTarget, 'deleted: "削除済み"'),
  "features/clothing/strings.ts に詳細画面文言の定義が不足しています",
);

check(
  "CDS-07",
  "静的エクスポート向けに服詳細/編集ページの generateStaticParams が fixture 全件を返す",
  includes(detailPageTarget, 'import { clothingDetailFixtures } from "@/mocks/fixtures/clothing";') &&
    includes(detailPageTarget, "return clothingDetailFixtures.map((fixture) => ({") &&
    includes(detailPageTarget, "wardrobeId: DEMO_IDS.wardrobe,") &&
    includes(detailPageTarget, "clothingId: fixture.clothingId,") &&
    includes(editPageTarget, 'import { clothingDetailFixtures } from "@/mocks/fixtures/clothing";') &&
    includes(editPageTarget, "return clothingDetailFixtures.map((fixture) => ({") &&
    includes(editPageTarget, "wardrobeId: DEMO_IDS.wardrobe,") &&
    includes(editPageTarget, "clothingId: fixture.clothingId,"),
  "detail/edit ページの静的パス生成が fixture 全件対応になっていません",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
