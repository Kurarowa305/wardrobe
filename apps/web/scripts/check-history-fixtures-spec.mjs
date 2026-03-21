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

const target = "src/mocks/fixtures/history.ts";

check(
  "HF-01",
  "History fixture が src/mocks/fixtures/history.ts に存在する",
  exists(target),
  "src/mocks/fixtures/history.ts が存在しません",
);

check(
  "HF-02",
  "History fixture が一覧用/詳細用のデータを同一ファイルで定義している",
  includes(target, "export const historyDetailFixtures: HistoryDetailFixture[] =") &&
    includes(target, "export const historyListFixture: HistoryListResponseDto = {"),
  "一覧/詳細 fixture の定義が不足しています",
);

check(
  "HF-03",
  "History fixture が Template fixture と同じ wardrobeId を参照する",
  includes(target, 'import {\n  TEMPLATE_FIXTURE_WARDROBE_ID,\n  templateDetailFixtureById,\n} from "@/mocks/fixtures/template";') &&
    includes(target, "export const HISTORY_FIXTURE_WARDROBE_ID = TEMPLATE_FIXTURE_WARDROBE_ID;"),
  "history fixture の wardrobeId が template/clothing fixture と連動していません",
);

check(
  "HF-04",
  "テンプレ入力の履歴詳細 fixture は template fixture の同梱服データを再利用する",
  includes(target, "const templateFixture = templateDetailFixtureById[seed.templateId];") &&
    includes(target, "templateName: templateFixture.name,") &&
    includes(target, "clothingItems: templateFixture.clothingItems.map((clothingItem) => ({ ...clothingItem })),"),
  "テンプレ入力履歴の同梱服が template fixture と整合していません",
);

check(
  "HF-05",
  "組み合わせ入力の履歴詳細 fixture は clothing fixture の辞書から服詳細を解決する",
  includes(target, "const clothingFixture = clothingDetailFixtureById[clothingId];") &&
    includes(target, "clothingItems: seed.clothingIds.map(toHistoryDetailClothingItem),"),
  "組み合わせ入力履歴の同梱服が clothing fixture と整合していません",
);

check(
  "HF-06",
  "一覧 fixture は詳細 fixture から historyId/date/name/clothingItems を射影して作られる",
  includes(target, "items: historyDetailFixtures.map(") &&
    includes(target, "historyId: fixture.historyId,") &&
    includes(target, "date: fixture.date,") &&
    includes(target, "name: fixture.templateName,") &&
    includes(target, "clothingItems: fixture.clothingItems.map((clothingItem) => ({") &&
    includes(target, "status: clothingItem.status,"),
  "一覧/詳細の整合性を担保する生成ロジックが不足しています",
);

check(
  "HF-07",
  "fixture がテンプレ入力・組み合わせ入力・削除済み服を含む",
  includes(target, 'historyId: "hs_01HZZCCC"') &&
    includes(target, 'templateId: "tp_01HZZBBB"') &&
    includes(target, 'historyId: "hs_01HZZCCD"') &&
    includes(target, 'clothingIds: ["cl_01HZZAAB", "cl_auto_004", "cl_01HZZAAC"]') &&
    includes(target, 'historyId: "hs_01HZZCCE"') &&
    includes(target, 'templateId: "tp_01HZZBBD"'),
  "テンプレ入力/組み合わせ入力/削除済みデータのケースが不足しています",
);

check(
  "HF-08",
  "詳細 fixture の ID 引き辞書が定義され、詳細取得で再利用できる",
  includes(target, "export const historyDetailFixtureById =") &&
    includes(target, "historyDetailFixtures.reduce<Record<string, HistoryDetailFixture>>(") &&
    includes(target, "accumulator[fixture.historyId] = fixture;"),
  "詳細 fixture を再利用するための ID 辞書定義が不足しています",
);

check(
  "HF-09",
  "historyDetailFixtures が合計32件（直近8件 + 追加24件）で構成される",
  includes(target, "const GENERATED_HISTORY_FIXTURE_COUNT = 24;") &&
    includes(target, 'historyId: "hs_01HZZCCJ"') &&
    includes(target, "...Array.from({ length: GENERATED_HISTORY_FIXTURE_COUNT },"),
  "32件構成（直近8件 + 24件追加）の定義が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
