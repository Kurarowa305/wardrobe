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
  "TF-01",
  "Template fixture が src/mocks/fixtures/template.ts に存在する",
  exists("src/mocks/fixtures/template.ts"),
  "src/mocks/fixtures/template.ts が存在しません",
);

check(
  "TF-02",
  "Template fixture が一覧用/詳細用のデータを同一ファイルで定義している",
  includes("src/mocks/fixtures/template.ts", "export const templateDetailFixtures: TemplateDetailFixture[] =") &&
    includes("src/mocks/fixtures/template.ts", "export const templateListFixture: TemplateListResponseDto = {"),
  "一覧/詳細 fixture の定義が不足しています",
);

check(
  "TF-03",
  "Template fixture が Clothing fixture と同じ wardrobeId を参照する",
  includes(
    "src/mocks/fixtures/template.ts",
    'import { CLOTHING_FIXTURE_WARDROBE_ID, clothingDetailFixtureById } from "@/mocks/fixtures/clothing";',
  ) &&
    includes(
      "src/mocks/fixtures/template.ts",
      "export const TEMPLATE_FIXTURE_WARDROBE_ID = CLOTHING_FIXTURE_WARDROBE_ID;",
    ),
  "template fixture の wardrobeId が clothing fixture と連動していません",
);

check(
  "TF-04",
  "Template 詳細 fixture の同梱服データが clothing fixture の辞書から解決される",
  includes("src/mocks/fixtures/template.ts", "const clothingFixture = clothingDetailFixtureById[clothingId];") &&
    includes("src/mocks/fixtures/template.ts", "clothingItems: seed.clothingIds.map(toTemplateClothingItem),"),
  "同梱服データの参照元が clothing fixture と連動していません",
);

check(
  "TF-05",
  "一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる",
  includes("src/mocks/fixtures/template.ts", "items: templateDetailFixtures") &&
    includes("src/mocks/fixtures/template.ts", '.filter((fixture) => fixture.status === "ACTIVE")') &&
    includes("src/mocks/fixtures/template.ts", "templateId: fixture.templateId,") &&
    includes("src/mocks/fixtures/template.ts", "name: fixture.name,") &&
    includes("src/mocks/fixtures/template.ts", "clothingItems: fixture.clothingItems.map((clothingItem) => ({") &&
    includes("src/mocks/fixtures/template.ts", "clothingId: clothingItem.clothingId,") &&
    includes("src/mocks/fixtures/template.ts", "imageKey: clothingItem.imageKey,") &&
    includes("src/mocks/fixtures/template.ts", "status: clothingItem.status,"),
  "一覧/詳細の整合性を担保する生成ロジックが不足しています",
);

check(
  "TF-06",
  "fixture が削除済みテンプレート・削除済み服・画像なし服を含む",
  includes("src/mocks/fixtures/template.ts", 'status: "DELETED"') &&
    includes("src/mocks/fixtures/template.ts", 'clothingIds: ["cl_01HZZAAB", "cl_01HZZAAC"]') &&
    includes("src/mocks/fixtures/template.ts", "imageKey: clothingItem.imageKey,"),
  "削除済みテンプレート/削除済み服/画像なし服のケースが不足しています",
);

check(
  "TF-07",
  "詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる",
  includes("src/mocks/fixtures/template.ts", "export const templateDetailFixtureById =") &&
    includes("src/mocks/fixtures/template.ts", "templateDetailFixtures.reduce<Record<string, TemplateDetailFixture>>(") &&
    includes("src/mocks/fixtures/template.ts", "accumulator[fixture.templateId] = fixture;"),
  "詳細 fixture を再利用するための ID 辞書定義が不足しています",
);

check(
  "TF-08",
  "templateDetailFixtures が合計30件（既存3件 + 追加27件）で構成される",
  includes("src/mocks/fixtures/template.ts", "const GENERATED_TEMPLATE_FIXTURE_COUNT = 27;") &&
    includes("src/mocks/fixtures/template.ts", "...Array.from({ length: GENERATED_TEMPLATE_FIXTURE_COUNT },"),
  "30件構成（3件 + 27件追加）の定義が不足しています",
);

check(
  "TF-09",
  "fixture に構成服が5つ以上のテンプレートが含まれる",
  includes("src/mocks/fixtures/template.ts", 'templateId: "tp_01HZZBBB"') &&
    includes("src/mocks/fixtures/template.ts", '      "cl_auto_003",'),
  "5件以上の構成服を持つテンプレート fixture が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
