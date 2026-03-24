import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const schemaModulePath = path.join(root, "src/domains/template/schema/templateSchema.ts");
const dtoModulePath = path.join(root, "src/domains/template/dto/templateDto.ts");
const entityModulePath = path.join(root, "src/domains/template/entities/template.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const schemaModule = await import(schemaModulePath);
const entityModule = await import(entityModulePath);
const schemaSource = readFileSync(schemaModulePath, "utf8");
const dtoSource = readFileSync(dtoModulePath, "utf8");
const entitySource = readFileSync(entityModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const createRequest = schemaModule.createTemplateRequestSchema.parse({
  name: "仕事用",
  clothingIds: ["cl_01", "cl_02", "cl_03"],
});

const updateRequest = schemaModule.updateTemplateRequestSchema.parse({
  clothingIds: ["cl_10", "cl_11"],
});

const listParams = schemaModule.templateListParamsSchema.parse({
  order: "desc",
  limit: 20,
  cursor: "CURSOR#001",
});

const detail = schemaModule.templateDetailResponseSchema.parse({
  name: "普段着",
  status: "ACTIVE",
  wearCount: 12,
  lastWornAt: 1735690000123,
  clothingItems: [
    {
      clothingId: "cl_01HZZAAA",
      name: "黒Tシャツ",
      genre: "tops",
      imageKey: null,
      status: "ACTIVE",
      wearCount: 12,
      lastWornAt: 1735690000123,
    },
  ],
});

const entity = schemaModule.templateEntitySchema.parse({
  wardrobeId: "wd_01HZZAAA",
  templateId: "tp_01HZZAAA",
  name: "普段着",
  status: "DELETED",
  clothingIds: ["cl_01HZZAAA", "cl_01HZZBBB"],
  wearCount: 12,
  lastWornAt: 1735690000123,
  createdAt: 1735600000000,
  deletedAt: 1735700000000,
});

const createdEntity = entityModule.createTemplateEntity({
  wardrobeId: "wd_01HZZAAA",
  templateId: "tp_01HZZBBB",
  name: "仕事用",
  clothingIds: ["cl_10", "cl_11"],
  now: 1735600000000,
});

const deletedEntity = entityModule.markTemplateDeleted(createdEntity, 1735700000000);

let invalidRequestError;
try {
  schemaModule.createTemplateRequestSchema.parse({
    name: "",
    clothingIds: new Array(21).fill("cl_over"),
  });
} catch (error) {
  invalidRequestError = error;
}

assert.ok(invalidRequestError instanceof Error);

const checks = [
  {
    name: "schema defines template status/order and field constraints",
    ok:
      Array.isArray(schemaModule.templateStatusValues) &&
      schemaModule.templateStatusValues.join(",") === "ACTIVE,DELETED" &&
      schemaModule.templateListOrderValues.join(",") === "asc,desc" &&
      schemaModule.templateNameMaxLength === 40 &&
      schemaModule.templateClothingIdsMax === 20 &&
      schemaModule.templateListLimitMax === 30,
    detail: schemaModule,
  },
  {
    name: "request and query schemas parse API-08/API-09/API-11 payloads including ordered clothingIds",
    ok:
      createRequest.name === "仕事用" &&
      createRequest.clothingIds.join(",") === "cl_01,cl_02,cl_03" &&
      updateRequest.clothingIds.join(",") === "cl_10,cl_11" &&
      listParams.order === "desc" &&
      listParams.limit === 20 &&
      listParams.cursor === "CURSOR#001",
    detail: { createRequest, updateRequest, listParams },
  },
  {
    name: "detail response and entity schemas cover template fields including clothingItems and clothingIds max constraints",
    ok:
      detail.status === "ACTIVE" &&
      detail.wearCount === 12 &&
      detail.clothingItems.length === 1 &&
      entity.clothingIds.length === 2 &&
      entity.createdAt === 1735600000000 &&
      entity.deletedAt === 1735700000000 &&
      entity.status === "DELETED",
    detail: { detail, entity },
  },
  {
    name: "entity helpers create ACTIVE template defaults and support logical delete",
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
    name: "source exports dto aliases and schema/entity modules for template domain",
    ok:
      dtoSource.includes("export type TemplateStatusDto") &&
      dtoSource.includes("export type CreateTemplateRequestDto") &&
      dtoSource.includes("export type TemplateListResponseDto") &&
      schemaSource.includes("export const templateEntitySchema") &&
      entitySource.includes("export function createTemplateEntity") &&
      entitySource.includes("export function markTemplateDeleted"),
  },
  {
    name: "package script and CI include template schema spec test",
    ok:
      packageJson.includes('"test:template-schema": "node --import tsx/esm scripts/check-template-schema-spec.mjs"') &&
      packageJson.includes("pnpm run test:template-schema") &&
      ciSource.includes("pnpm --filter api test:template-schema"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T01 template schema spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T01 template schema spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
