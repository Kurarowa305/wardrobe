import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const failures = [];
let checkCount = 0;

function read(relPath) {
  return fs.readFileSync(path.join(webRoot, relPath), "utf8");
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

const clothingHandler = "src/mocks/handlers/clothing.ts";
const templateHandler = "src/mocks/handlers/template.ts";

check(
  "TCR-01",
  "Clothing handler が現在の服状態を参照用スナップショットとして公開する",
  includes(clothingHandler, "export function getClothingSnapshotById(clothingId: string): ClothingDetailResponseDto | undefined {") &&
    includes(clothingHandler, "const clothing = clothingStore.find((item) => item.clothingId === clothingId);") &&
    includes(clothingHandler, "return clothing ? { ...clothing } : undefined;"),
  "服ハンドラにテンプレート参照向けのスナップショット取得関数が不足しています",
);

check(
  "TCR-02",
  "Template handler が fixture 固定ではなく clothing handler の現在状態から構成服を解決する",
  includes(templateHandler, 'import { getClothingSnapshotById } from "./clothing";') &&
    includes(templateHandler, ".map((clothingId) => getClothingSnapshotById(clothingId))") &&
    !includes(templateHandler, 'from "@/mocks/fixtures/clothing";'),
  "テンプレート参照服の解決元が現在の服状態に切り替わっていません",
);

check(
  "TCR-03",
  "Template handler が一覧・詳細返却前に構成服状態を同期し、削除済み表記へ反映できる",
  includes(templateHandler, "function syncTemplateClothingItems(template: TemplateRecord): TemplateRecord {") &&
    includes(templateHandler, ".map(syncTemplateClothingItems)") &&
    includes(templateHandler, "const syncedTemplate = syncTemplateClothingItems(template);") &&
    includes(templateHandler, "clothingItems: syncedTemplate.clothingItems,"),
  "一覧/詳細返却前の構成服同期処理が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
