import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");

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

function check(id, description, passed, detail) {
  checkCount += 1;
  if (passed) {
    console.log(`PASS ${id}: ${description}`);
    return;
  }
  failures.push(`FAIL ${id}: ${description}\n  ${detail}`);
}

const apiTagSource = fs.readFileSync(path.join(repoRoot, "apps/api/src/domains/tags/itemTagSchema.ts"), "utf8");
const webTagSource = read("src/features/tags/itemTags.ts");
const webSchemaSource = read("src/api/schemas/itemTag.ts");
const clothingSchemaSource = read("src/api/schemas/clothing.ts");
const templateSchemaSource = read("src/api/schemas/template.ts");
const clothingCreateSource = read("src/components/app/screens/ClothingCreateScreen.tsx");
const clothingEditSource = read("src/components/app/screens/ClothingEditScreen.tsx");
const clothingDetailSource = read("src/components/app/screens/ClothingDetailScreen.tsx");
const templateFormSource = read("src/components/app/screens/TemplateForm.tsx");
const templateDetailSource = read("src/components/app/screens/TemplateDetailScreen.tsx");
const packageJson = read("package.json");
const ciSource = fs.readFileSync(path.join(repoRoot, ".github/workflows/ci.yml"), "utf8");

const tagIds = ["season:summer", "season:winter", "season:all"];

check(
  "ITW-01",
  "web tag schema and display catalog files exist",
  exists("src/api/schemas/itemTag.ts") &&
    exists("src/features/tags/itemTags.ts") &&
    exists("src/components/app/tags/ItemTagSelector.tsx") &&
    exists("src/components/app/tags/ItemTagChips.tsx"),
  "タグschema/catalog/components のいずれかが不足しています",
);

check(
  "ITW-02",
  "API allowed tag IDs and web display catalog IDs are aligned",
  tagIds.every((tagId) => apiTagSource.includes(`"${tagId}"`) && webTagSource.includes(`"${tagId}"`) && webSchemaSource.includes(`"${tagId}"`)),
  "API正本、web DTO、web表示カタログのタグIDが一致していません",
);

check(
  "ITW-03",
  "web display catalog defines Japanese labels and stable order",
  webTagSource.includes('{ id: "season:summer", label: "夏" }') &&
    webTagSource.includes('{ id: "season:winter", label: "冬" }') &&
    webTagSource.includes('{ id: "season:all", label: "オールシーズン" }') &&
    webTagSource.includes("sortItemTagIds"),
  "タグ表示ラベルまたは表示順の定義が不足しています",
);

check(
  "ITW-04",
  "clothing/template DTOs include tagIds in request and response types",
  clothingSchemaSource.includes("tagIds?: ItemTagIdDto[];") &&
    clothingSchemaSource.includes("tagIds: ItemTagIdDto[];") &&
    templateSchemaSource.includes("tagIds?: ItemTagIdDto[];") &&
    templateSchemaSource.includes("tagIds: ItemTagIdDto[];"),
  "服/テンプレート DTO の tagIds 定義が不足しています",
);

check(
  "ITW-05",
  "create/edit screens send selected tagIds",
  clothingCreateSource.includes("selectedTagIds") &&
    clothingCreateSource.includes("tagIds: selectedTagIds") &&
    clothingEditSource.includes("setSelectedTagIds(clothingQuery.data.tagIds)") &&
    clothingEditSource.includes("tagIds: selectedTagIds") &&
    templateFormSource.includes("setSelectedTagIds(templateQuery.data.tagIds)") &&
    templateFormSource.includes("tagIds: selectedTagIds"),
  "作成/編集画面の tagIds state または送信payloadが不足しています",
);

check(
  "ITW-06",
  "detail screens render tag chips with empty state",
  clothingDetailSource.includes("ItemTagChips") &&
    clothingDetailSource.includes("CLOTHING_STRINGS.detail.messages.noTags") &&
    templateDetailSource.includes("ItemTagChips") &&
    templateDetailSource.includes("TEMPLATE_STRINGS.detail.messages.noTags"),
  "詳細画面のタグ表示またはタグなし表示が不足しています",
);

check(
  "ITW-07",
  "package script and CI include item tags web spec",
  packageJson.includes('"test:item-tags-web": "node scripts/check-item-tags-web-spec.mjs"') &&
    ciSource.includes("pnpm --filter web test:item-tags-web"),
  "package.json または CI の item-tags-web 実行設定が不足しています",
);

if (failures.length > 0) {
  console.error(`\n${failures.length}件の失敗 / ${checkCount}件中`);
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`\nAll checks passed (${checkCount}件)`);
