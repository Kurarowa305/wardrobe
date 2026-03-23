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
check("CF-01", "Clothing fixture が存在する", exists("src/mocks/fixtures/clothing.ts"), "fixture が存在しません");
check("CF-02", "一覧用/詳細用のデータを同一ファイルで定義している", includes("src/mocks/fixtures/clothing.ts", "export const clothingDetailFixtures: ClothingDetailResponseDto[] = [") && includes("src/mocks/fixtures/clothing.ts", "export const clothingListFixture: ClothingListResponseDto = {"), "一覧/詳細 fixture が不足しています");
check("CF-03", "一覧 fixture は詳細 fixture から ACTIVE のみを抽出して作られる", includes("src/mocks/fixtures/clothing.ts", '.filter((fixture) => fixture.status === "ACTIVE")') && includes("src/mocks/fixtures/clothing.ts", 'genre: fixture.genre,'), "一覧生成時の ACTIVE/genre 連動が不足しています");
check("CF-04", "fixture が各ジャンルで画像あり/なしと削除済みデータを含む", includes("src/mocks/fixtures/clothing.ts", 'genre: "tops"') && includes("src/mocks/fixtures/clothing.ts", 'genre: "bottoms"') && includes("src/mocks/fixtures/clothing.ts", 'genre: "others"') && includes("src/mocks/fixtures/clothing.ts", 'imageKey: null') && includes("src/mocks/fixtures/clothing.ts", 'status: "DELETED"'), "ジャンル別 fixture または削除済みデータが不足しています");
check("CF-05", "詳細 fixture の ID 引き辞書が定義される", includes("src/mocks/fixtures/clothing.ts", "export const clothingDetailFixtureById =") && includes("src/mocks/fixtures/clothing.ts", "accumulator[fixture.clothingId] = fixture;"), "ID 辞書定義が不足しています");
check("CF-06", "トップス・ボトムス・その他それぞれに自動読み込み検証用の50件近い fixture を用意する", includes("src/mocks/fixtures/clothing.ts", "const GENERATED_FIXTURES_PER_GENRE = 49;") && includes("src/mocks/fixtures/clothing.ts", 'const FIXTURE_GENRE_ORDER = ["tops", "bottoms", "others"]'), "各ジャンルの fixture 定義が不足しています");
if (failures.length > 0) { console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`); console.error(failures.join("\n\n")); process.exit(1); }
console.log(`\nAll checks passed (${checkCount}件)`);
