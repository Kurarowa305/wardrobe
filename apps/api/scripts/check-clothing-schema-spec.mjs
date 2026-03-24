import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const schemaModulePath = path.join(root, "src/domains/clothing/schema/clothingSchema.ts");
const dtoModulePath = path.join(root, "src/domains/clothing/dto/clothingDto.ts");
const entityModulePath = path.join(root, "src/domains/clothing/entities/clothing.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const schemaModule = await import(schemaModulePath);
const entityModule = await import(entityModulePath);
const schemaSource = readFileSync(schemaModulePath, "utf8");
const dtoSource = readFileSync(dtoModulePath, "utf8");
const entitySource = readFileSync(entityModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const createRequest = schemaModule.createClothingRequestSchema.parse({
  name: "白シャツ",
  genre: "tops",
  imageKey: "clothing/white-shirt.png",
});

const updateRequest = schemaModule.updateClothingRequestSchema.parse({
  name: "白シャツ（新）",
  imageKey: null,
});

const listParams = schemaModule.clothingListParamsSchema.parse({
  order: "desc",
  genre: "others",
  limit: 20,
  cursor: "CURSOR#001",
});

const detail = schemaModule.clothingDetailResponseSchema.parse({
  clothingId: "cl_01HZZAAA",
  name: "黒Tシャツ",
  genre: "tops",
  imageKey: null,
  status: "ACTIVE",
  wearCount: 12,
  lastWornAt: 1735690000123,
});

const entity = schemaModule.clothingEntitySchema.parse({
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZAAA",
  name: "黒Tシャツ",
  genre: "tops",
  imageKey: "clothing/black-t.png",
  status: "DELETED",
  wearCount: 12,
  lastWornAt: 1735690000123,
  createdAt: 1735600000000,
  deletedAt: 1735700000000,
});

const createdEntity = entityModule.createClothingEntity({
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZBBB",
  name: "白シャツ",
  genre: "tops",
  now: 1735600000000,
});

const deletedEntity = entityModule.markClothingDeleted(createdEntity, 1735700000000);

let invalidRequestError;
try {
  schemaModule.createClothingRequestSchema.parse({
    name: "",
    genre: "invalid",
  });
} catch (error) {
  invalidRequestError = error;
}

assert.ok(invalidRequestError instanceof Error);

const checks = [
  {
    name: "schema defines clothing status, genre, order, and field constraints",
    ok:
      Array.isArray(schemaModule.clothingStatusValues) &&
      schemaModule.clothingStatusValues.join(",") === "ACTIVE,DELETED" &&
      schemaModule.clothingGenreValues.join(",") === "tops,bottoms,others" &&
      schemaModule.clothingListOrderValues.join(",") === "asc,desc" &&
      schemaModule.clothingNameMaxLength === 40 &&
      schemaModule.clothingListLimitMax === 50,
    detail: schemaModule,
  },
  {
    name: "request and query schemas parse API-03/API-04/API-06 payloads (update: name/imageKey partial)",
    ok:
      createRequest.name === "白シャツ" &&
      createRequest.genre === "tops" &&
      createRequest.imageKey === "clothing/white-shirt.png" &&
      updateRequest.name === "白シャツ（新）" &&
      updateRequest.imageKey === null &&
      listParams.order === "desc" &&
      listParams.genre === "others" &&
      listParams.limit === 20 &&
      listParams.cursor === "CURSOR#001",
    detail: { createRequest, updateRequest, listParams },
  },
  {
    name: "detail response and entity schemas cover required clothing fields including createdAt and deletedAt",
    ok:
      detail.status === "ACTIVE" &&
      detail.wearCount === 12 &&
      detail.lastWornAt === 1735690000123 &&
      entity.createdAt === 1735600000000 &&
      entity.deletedAt === 1735700000000 &&
      entity.status === "DELETED",
    detail: { detail, entity },
  },
  {
    name: "entity helpers create ACTIVE clothing defaults and support logical delete",
    ok:
      createdEntity.status === "ACTIVE" &&
      createdEntity.wearCount === 0 &&
      createdEntity.lastWornAt === 0 &&
      createdEntity.createdAt === 1735600000000 &&
      createdEntity.deletedAt === null &&
      deletedEntity.status === "DELETED" &&
      deletedEntity.deletedAt === 1735700000000,
    detail: { createdEntity, deletedEntity },
  },
  {
    name: "source exports dto aliases and schema/entity modules for clothing domain",
    ok:
      dtoSource.includes("export type ClothingStatusDto") &&
      dtoSource.includes("export type CreateClothingRequestDto") &&
      dtoSource.includes("export type ClothingListResponseDto") &&
      schemaSource.includes("export const clothingEntitySchema") &&
      entitySource.includes("export function createClothingEntity") &&
      entitySource.includes("export function markClothingDeleted"),
  },
  {
    name: "package script and CI include clothing schema spec test",
    ok:
      packageJson.includes('"test:clothing-schema": "node --import tsx/esm scripts/check-clothing-schema-spec.mjs"') &&
      packageJson.includes('pnpm run test:clothing-schema') &&
      ciSource.includes('pnpm --filter api test:clothing-schema'),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T01 clothing schema spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T01 clothing schema spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
