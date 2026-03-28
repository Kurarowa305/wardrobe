import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const schemaModulePath = path.join(root, "src/domains/history/schema/historySchema.ts");
const dtoModulePath = path.join(root, "src/domains/history/dto/historyDto.ts");
const entityModulePath = path.join(root, "src/domains/history/entities/history.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const schemaModule = await import(schemaModulePath);
const entityModule = await import(entityModulePath);
const schemaSource = readFileSync(schemaModulePath, "utf8");
const dtoSource = readFileSync(dtoModulePath, "utf8");
const entitySource = readFileSync(entityModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const templateInput = schemaModule.createHistoryRequestSchema.parse({
  date: "20260101",
  templateId: "tp_01HZZBBB",
});

const combinationInput = schemaModule.createHistoryRequestSchema.parse({
  date: "20260102",
  clothingIds: ["cl_01", "cl_02", "cl_03", "cl_04"],
});

const listParams = schemaModule.historyListParamsSchema.parse({
  from: "20260101",
  to: "20260131",
  order: "desc",
  limit: 30,
  cursor: "DATE#20260121#hs_001",
});

const listResponse = schemaModule.historyListResponseSchema.parse({
  items: [
    {
      historyId: "hs_01HZZCCC",
      date: "20260101",
      name: "普段着",
      clothingItems: [
        {
          clothingId: "cl_01",
          name: "黒Tシャツ",
          genre: "tops",
          imageKey: "clothing/black.png",
          status: "ACTIVE",
        },
      ],
    },
  ],
  nextCursor: "DATE#20251225#hs_01",
});

const detailResponse = schemaModule.historyDetailResponseSchema.parse({
  date: "20260101",
  templateName: "普段着",
  clothingItems: [
    {
      clothingId: "cl_01",
      name: "黒Tシャツ",
      genre: "tops",
      imageKey: null,
      status: "ACTIVE",
      wearCount: 8,
      lastWornAt: 1735600000000,
    },
  ],
});

const entity = schemaModule.historyEntitySchema.parse({
  wardrobeId: "wd_01HZZAAA",
  historyId: "hs_01HZZAAA",
  date: "20260101",
  templateId: null,
  clothingIds: ["cl_01", "cl_02"],
  createdAt: 1735600000000,
});

const createdEntity = entityModule.createHistoryEntity({
  wardrobeId: "wd_01HZZAAA",
  historyId: "hs_01HZZBBB",
  date: "20260102",
  templateId: "tp_01HZZBBB",
  clothingIds: ["cl_01", "cl_03"],
  createdAt: 1735600001000,
});

let invalidInputError;
try {
  schemaModule.createHistoryRequestSchema.parse({
    date: "20260101",
    templateId: "tp_01",
    clothingIds: ["cl_01"],
  });
} catch (error) {
  invalidInputError = error;
}

assert.ok(invalidInputError instanceof Error);

const checks = [
  {
    name: "schema defines history fields and limits from API design",
    ok:
      Array.isArray(schemaModule.historyListOrderValues) &&
      schemaModule.historyListOrderValues.join(",") === "asc,desc" &&
      schemaModule.historyClothingIdsMax === 4 &&
      schemaModule.historyListLimitMax === 30,
    detail: schemaModule,
  },
  {
    name: "request and query schemas parse API-13/API-14 payloads",
    ok:
      templateInput.templateId === "tp_01HZZBBB" &&
      !("clothingIds" in templateInput) &&
      combinationInput.clothingIds.length === 4 &&
      !("templateId" in combinationInput) &&
      listParams.order === "desc" &&
      listParams.limit === 30,
    detail: { templateInput, combinationInput, listParams },
  },
  {
    name: "list/detail response and entity schemas cover required history fields",
    ok:
      listResponse.items.length === 1 &&
      listResponse.items[0].clothingItems.length === 1 &&
      detailResponse.clothingItems[0].wearCount === 8 &&
      entity.date === "20260101" &&
      entity.templateId === null &&
      entity.createdAt === 1735600000000,
    detail: { listResponse, detailResponse, entity },
  },
  {
    name: "entity helper creates history entity from key and core attributes",
    ok:
      createdEntity.wardrobeId === "wd_01HZZAAA" &&
      createdEntity.historyId === "hs_01HZZBBB" &&
      createdEntity.templateId === "tp_01HZZBBB" &&
      createdEntity.clothingIds.join(",") === "cl_01,cl_03",
    detail: createdEntity,
  },
  {
    name: "source exports history dto aliases and schema/entity modules",
    ok:
      dtoSource.includes("export type HistoryListOrderDto") &&
      dtoSource.includes("export type CreateHistoryRequestDto") &&
      dtoSource.includes("export type HistoryDetailResponseDto") &&
      schemaSource.includes("export const historyEntitySchema") &&
      entitySource.includes("export function createHistoryEntity"),
  },
  {
    name: "package script and CI include history schema spec test",
    ok:
      packageJson.includes('"test:history-schema": "node --import tsx/esm scripts/check-history-schema-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-schema") &&
      ciSource.includes("pnpm --filter api test:history-schema"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T01 history schema spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T01 history schema spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
