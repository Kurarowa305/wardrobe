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
  "CF-01",
  "Clothing fixture が src/mocks/fixtures/clothing.ts に存在する",
  exists("src/mocks/fixtures/clothing.ts"),
  "src/mocks/fixtures/clothing.ts が存在しません",
);

check(
  "CF-02",
  "clothing fixture が一覧用/詳細用のデータを同一ファイルで定義している",
  includes("src/mocks/fixtures/clothing.ts", "export const clothingDetailFixtures: ClothingDetailResponseDto[] = [") &&
    includes("src/mocks/fixtures/clothing.ts", "export const clothingListFixture: ClothingListResponseDto = {"),
  "一覧/詳細 fixture の定義が不足しています",
);

check(
  "CF-03",
  "一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる",
  includes("src/mocks/fixtures/clothing.ts", "items: clothingDetailFixtures") &&
    includes("src/mocks/fixtures/clothing.ts", '.filter((fixture) => fixture.status === "ACTIVE")') &&
    includes("src/mocks/fixtures/clothing.ts", "clothingId: fixture.clothingId,") &&
    includes("src/mocks/fixtures/clothing.ts", "name: fixture.name,") &&
    includes("src/mocks/fixtures/clothing.ts", "imageKey: fixture.imageKey,"),
  "一覧/詳細の整合性を担保する生成ロジックが不足しています",
);

check(
  "CF-04",
  "fixture が 画像あり/なし と 削除済みデータを含む",
  includes("src/mocks/fixtures/clothing.ts", "imageKey: \"clothing/black_t.png\"") &&
    includes("src/mocks/fixtures/clothing.ts", "imageKey: null") &&
    includes("src/mocks/fixtures/clothing.ts", 'status: "DELETED"'),
  "画像あり/なし、または削除済みデータが不足しています",
);

check(
  "CF-05",
  "詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる",
  includes("src/mocks/fixtures/clothing.ts", "export const clothingDetailFixtureById =") &&
    includes("src/mocks/fixtures/clothing.ts", "clothingDetailFixtures.reduce<Record<string, ClothingDetailResponseDto>>(") &&
    includes("src/mocks/fixtures/clothing.ts", "accumulator[fixture.clothingId] = fixture;"),
  "詳細 fixture を再利用するための ID 辞書定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
