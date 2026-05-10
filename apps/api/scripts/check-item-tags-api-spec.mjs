import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const tagModulePath = path.join(root, "src/domains/tags/itemTagSchema.ts");
const clothingSchemaPath = path.join(root, "src/domains/clothing/schema/clothingSchema.ts");
const clothingEntityPath = path.join(root, "src/domains/clothing/entities/clothing.ts");
const clothingDtoPath = path.join(root, "src/domains/clothing/dto/clothingDetailDto.ts");
const clothingUsecasePath = path.join(root, "src/domains/clothing/usecases/clothingUsecase.ts");
const templateSchemaPath = path.join(root, "src/domains/template/schema/templateSchema.ts");
const templateEntityPath = path.join(root, "src/domains/template/entities/template.ts");
const templateUsecasePath = path.join(root, "src/domains/template/usecases/templateUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const tagModule = await import(tagModulePath);
const clothingSchema = await import(clothingSchemaPath);
const clothingEntity = await import(clothingEntityPath);
const clothingDto = await import(clothingDtoPath);
const clothingUsecase = await import(clothingUsecasePath);
const templateSchema = await import(templateSchemaPath);
const templateEntity = await import(templateEntityPath);
const templateUsecase = await import(templateUsecasePath);

const tagSource = readFileSync(tagModulePath, "utf8");
const clothingRepoSource = readFileSync(path.join(root, "src/domains/clothing/repo/clothingRepo.ts"), "utf8");
const templateRepoSource = readFileSync(path.join(root, "src/domains/template/repo/templateRepo.ts"), "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const expectedTagIds = ["season:spring", "season:summer", "season:autumn", "season:winter", "season:all"];

const clothingCreate = clothingSchema.createClothingRequestSchema.parse({
  name: "白シャツ",
  genre: "tops",
  tagIds: ["season:summer", "season:all"],
});
const clothingUpdateClear = clothingSchema.updateClothingRequestSchema.parse({ tagIds: [] });
const clothingLegacyDetail = clothingDto.toClothingDetailResponseDto({
  clothingId: "cl_001",
  name: "旧データ",
  genre: "tops",
  imageKey: null,
  status: "ACTIVE",
  wearCount: 0,
  lastWornAt: 0,
});
const clothingCreatedDefault = clothingEntity.createClothingEntity({
  wardrobeId: "wd_001",
  clothingId: "cl_002",
  name: "タグなし",
  genre: "others",
  now: 1,
});

const templateCreate = templateSchema.createTemplateRequestSchema.parse({
  name: "夏用",
  clothingIds: ["cl_001"],
  tagIds: ["season:summer"],
});
const templateUpdateClear = templateSchema.updateTemplateRequestSchema.parse({ tagIds: [] });
const templateCreatedDefault = templateEntity.createTemplateEntity({
  wardrobeId: "wd_001",
  templateId: "tp_001",
  name: "タグなしテンプレート",
  clothingIds: ["cl_001"],
  now: 1,
});

assert.deepEqual(tagModule.itemTagIdValues, expectedTagIds);

assert.throws(() => clothingSchema.createClothingRequestSchema.parse({ name: "不正", genre: "tops", tagIds: ["season:summer", "season:summer"] }));
assert.throws(() => clothingSchema.createClothingRequestSchema.parse({ name: "不正", genre: "tops", tagIds: ["unknown"] }));
assert.throws(() => templateSchema.createTemplateRequestSchema.parse({ name: "不正", clothingIds: ["cl_001"], tagIds: ["season:summer", "season:summer"] }));
assert.throws(() => templateSchema.createTemplateRequestSchema.parse({ name: "不正", clothingIds: ["cl_001"], tagIds: ["unknown"] }));

let capturedClothingUpdate;
const clothingUpdateUsecase = clothingUsecase.createClothingUsecase({
  repo: {
    async get() {
      return {
        Item: {
          wardrobeId: "wd_001",
          clothingId: "cl_001",
          name: "既存服",
          genre: "tops",
          imageKey: null,
          status: "ACTIVE",
          wearCount: 1,
          lastWornAt: 2,
          createdAt: 3,
          deletedAt: null,
        },
      };
    },
    async update(input) {
      capturedClothingUpdate = input;
      return { ok: true };
    },
    async list() { return { Items: [] }; },
    async create() { return { ok: true }; },
    async delete() { return { ok: true }; },
  },
});
await clothingUpdateUsecase.update({ wardrobeId: "wd_001", clothingId: "cl_001", tagIds: ["season:winter"] });

let capturedTemplateUpdate;
const templateUpdateUsecase = templateUsecase.createTemplateUsecase({
  repo: {
    async get() {
      return {
        Item: {
          wardrobeId: "wd_001",
          templateId: "tp_001",
          name: "既存テンプレート",
          status: "ACTIVE",
          clothingIds: ["cl_001"],
          wearCount: 1,
          lastWornAt: 2,
          createdAt: 3,
          deletedAt: null,
        },
      };
    },
    async update(input) {
      capturedTemplateUpdate = input;
      return { ok: true };
    },
    async list() { return { Items: [] }; },
    async create() { return { ok: true }; },
    async delete() { return { ok: true }; },
  },
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [];
    },
  },
});
await templateUpdateUsecase.update({ wardrobeId: "wd_001", templateId: "tp_001", tagIds: [] });

const checks = [
  {
    name: "tag id catalog is fixed and API-owned",
    ok:
      tagModule.itemTagIdValues.join(",") === expectedTagIds.join(",") &&
      tagSource.includes("itemTagIdsSchema") &&
      tagSource.includes("tagIds must not contain duplicates"),
  },
  {
    name: "clothing schemas and legacy DTO handle tagIds",
    ok:
      clothingCreate.tagIds.join(",") === "season:summer,season:all" &&
      clothingUpdateClear.tagIds.length === 0 &&
      clothingLegacyDetail?.tagIds.length === 0 &&
      clothingCreatedDefault.tagIds.length === 0,
  },
  {
    name: "template schemas and entity defaults handle tagIds",
    ok:
      templateCreate.tagIds.join(",") === "season:summer" &&
      templateUpdateClear.tagIds.length === 0 &&
      templateCreatedDefault.tagIds.length === 0,
  },
  {
    name: "usecases preserve legacy entities and can update tagIds",
    ok:
      capturedClothingUpdate?.tagIds.join(",") === "season:winter" &&
      Array.isArray(capturedTemplateUpdate?.tagIds) &&
      capturedTemplateUpdate.tagIds.length === 0,
    detail: { capturedClothingUpdate, capturedTemplateUpdate },
  },
  {
    name: "repositories persist tagIds on update",
    ok:
      clothingRepoSource.includes("tagIds = :tagIds") &&
      clothingRepoSource.includes('":tagIds": item.tagIds') &&
      templateRepoSource.includes("tagIds = :tagIds") &&
      templateRepoSource.includes('":tagIds": item.tagIds'),
  },
  {
    name: "package script and CI include item tags API spec",
    ok:
      packageJson.includes('"test:item-tags-api": "node --import tsx/esm scripts/check-item-tags-api-spec.mjs"') &&
      packageJson.includes("pnpm run test:item-tags-api") &&
      ciSource.includes("pnpm --filter api test:item-tags-api"),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("Item tags API spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) console.error(failure.detail);
  }
  process.exit(1);
}

console.log("Item tags API spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
