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
const target = "src/mocks/fixtures/history.ts";
check("HF-01", "History fixture が存在する", exists(target), "fixture が存在しません");
check("HF-02", "一覧用/詳細用のデータを同一ファイルで定義している", includes(target, 'export const historyDetailFixtures: HistoryDetailFixture[] =') && includes(target, 'export const historyListFixture: HistoryListResponseDto = {'), "一覧/詳細 fixture が不足しています");
check("HF-03", "History fixture が Template fixture と同じ wardrobeId を参照する", includes(target, 'export const HISTORY_FIXTURE_WARDROBE_ID = TEMPLATE_FIXTURE_WARDROBE_ID;'), "wardrobeId 連動が不足しています");
check("HF-04", "テンプレ入力の履歴詳細 fixture は template fixture の同梱服データを再利用する", includes(target, 'const templateFixture = templateDetailFixtureById[seed.templateId];') && includes(target, 'templateName: templateFixture.name,') && includes(target, 'clothingItems: templateFixture.clothingItems.map((clothingItem) => ({ ...clothingItem })),'), "template fixture 再利用が不足しています");
check("HF-05", "組み合わせ入力の履歴詳細 fixture は clothing fixture の辞書から解決する", includes(target, 'const clothingFixture = clothingDetailFixtureById[clothingId];') && includes(target, 'clothingItems: seed.clothingIds.map(toHistoryDetailClothingItem),'), "clothing fixture 辞書解決が不足しています");
check("HF-06", "一覧 fixture は詳細 fixture から射影して作られる", includes(target, 'items: historyDetailFixtures.map((fixture): HistoryListItemDto => ({') && includes(target, 'name: fixture.templateName,') && includes(target, 'status: clothingItem.status,'), "一覧生成ロジックが不足しています");
check("HF-07", "fixture がテンプレ入力・組み合わせ入力・削除済み服を含む", includes(target, 'historyId: "hs_01HZZCCC"') && includes(target, 'templateId: "tp_01HZZBBB"') && includes(target, 'historyId: "hs_01HZZCCD"') && includes(target, 'clothingIds: ["cl_top_002", createGeneratedClothingId("bottom", 4), "cl_other_003"]') && includes(target, 'templateId: "tp_01HZZBBD"'), "テンプレ入力/組み合わせ入力/削除済みケースが不足しています");
check("HF-08", "詳細 fixture の ID 引き辞書が定義される", includes(target, 'export const historyDetailFixtureById =') && includes(target, 'accumulator[fixture.historyId] = fixture;'), "ID 辞書が不足しています");
check("HF-09", "history fixture にホーム用の直近1週間分データが含まれる", includes(target, 'date: "20260321"') && includes(target, 'date: "20260315"'), "直近1週間データが不足しています");
check("HF-10", "history fixture が自動読み込み検証用に30件超で構成される", includes(target, 'const GENERATED_HISTORY_FIXTURE_COUNT = 31;') && includes(target, '...Array.from({ length: GENERATED_HISTORY_FIXTURE_COUNT },'), "件数定義が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
