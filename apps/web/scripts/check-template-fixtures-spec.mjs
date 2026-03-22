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
check("TF-01", "Template fixture が存在する", exists("src/mocks/fixtures/template.ts"), "fixture が存在しません");
check("TF-02", "一覧用/詳細用のデータを同一ファイルで定義している", includes("src/mocks/fixtures/template.ts", 'export const templateDetailFixtures: TemplateDetailFixture[] =') && includes("src/mocks/fixtures/template.ts", 'export const templateListFixture: TemplateListResponseDto = {'), "一覧/詳細 fixture 定義が不足しています");
check("TF-03", "Template fixture が Clothing fixture と同じ wardrobeId を参照する", includes("src/mocks/fixtures/template.ts", 'export const TEMPLATE_FIXTURE_WARDROBE_ID = CLOTHING_FIXTURE_WARDROBE_ID;'), "wardrobeId 連動が不足しています");
check("TF-04", "Template 詳細 fixture の同梱服データが clothing fixture の辞書から解決される", includes("src/mocks/fixtures/template.ts", 'const clothingFixture = clothingDetailFixtureById[clothingId];') && includes("src/mocks/fixtures/template.ts", 'clothingItems: seed.clothingIds.map(toTemplateClothingItem),'), "clothing fixture 辞書解決が不足しています");
check("TF-05", "一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる", includes("src/mocks/fixtures/template.ts", '.filter((fixture) => fixture.status === "ACTIVE")') && includes("src/mocks/fixtures/template.ts", 'status: clothingItem.status,'), "ACTIVE 抽出または map が不足しています");
check("TF-06", "fixture が削除済みテンプレート・削除済み服・画像なし服を含む", includes("src/mocks/fixtures/template.ts", 'status: "DELETED"') && includes("src/mocks/fixtures/template.ts", 'clothingIds: ["cl_top_003", "cl_bottom_003", "cl_other_003"]') && includes("src/mocks/fixtures/template.ts", 'imageKey: clothingItem.imageKey,'), "削除済み/画像なしケースが不足しています");
check("TF-07", "詳細 fixture の ID 引き辞書が定義される", includes("src/mocks/fixtures/template.ts", 'export const templateDetailFixtureById =') && includes("src/mocks/fixtures/template.ts", 'accumulator[fixture.templateId] = fixture;'), "ID 辞書定義が不足しています");
check("TF-08", "templateDetailFixtures が合計30件で構成される", includes("src/mocks/fixtures/template.ts", 'const GENERATED_TEMPLATE_FIXTURE_COUNT = 27;') && includes("src/mocks/fixtures/template.ts", '...Array.from({ length: GENERATED_TEMPLATE_FIXTURE_COUNT },'), "30件構成の定義が不足しています");
check("TF-09", "fixture に構成服が5つ以上のテンプレートが含まれる", includes("src/mocks/fixtures/template.ts", 'templateId: "tp_01HZZBBB"') && includes("src/mocks/fixtures/template.ts", 'createGeneratedClothingId("bottom", 1)'), "5件以上の構成服を持つ fixture が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
