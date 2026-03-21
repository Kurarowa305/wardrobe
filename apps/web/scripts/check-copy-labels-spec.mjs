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

check(
  "CLS-CP-01",
  "服詳細文言が『着た回数』『最後に着た日』へ更新されている",
  includes("src/features/clothing/strings.ts", 'wearCount: "着た回数"') &&
    includes("src/features/clothing/strings.ts", 'lastWornAt: "最後に着た日"'),
  "服詳細画面の文言更新が不足しています",
);

check(
  "TLS-CP-02",
  "テンプレート詳細文言が『着た回数』『最後に着た日』へ更新されている",
  includes("src/features/template/strings.ts", 'wearCount: "着た回数"') &&
    includes("src/features/template/strings.ts", 'lastWornAt: "最後に着た日"') &&
    includes("src/features/template/strings.ts", 'clothingWearCount: "服の着た回数"') &&
    includes("src/features/template/strings.ts", 'clothingLastWornAt: "服の最後に着た日"'),
  "テンプレート詳細画面の文言更新が不足しています",
);

check(
  "HDS-CP-03",
  "履歴詳細文言が『着たテンプレート』『着た服』『着た回数』『最後に着た日』へ更新されている",
  includes("src/features/history/strings.ts", 'template: "着たテンプレート"') &&
    includes("src/features/history/strings.ts", 'clothingItems: "着た服"') &&
    includes("src/features/history/strings.ts", 'templateWearCount: "着た回数"') &&
    includes("src/features/history/strings.ts", 'templateLastWornAt: "最後に着た日"') &&
    includes("src/features/history/strings.ts", 'clothingWearCount: "着た回数"') &&
    includes("src/features/history/strings.ts", 'clothingLastWornAt: "最後に着た日"'),
  "履歴詳細画面の文言更新が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
