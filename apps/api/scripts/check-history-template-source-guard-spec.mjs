import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/history/usecases/createHistoryWithStatsWrite.ts");
const handlerModulePath = path.join(root, "src/domains/history/handlers/createHistoryHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const usecaseSource = readFileSync(usecaseModulePath, "utf8");
const handlerSource = readFileSync(handlerModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryWithStatsWriteUsecase } = await import(usecaseModulePath);
const { createHistoryHandler } = await import(handlerModulePath);

const usecase = createHistoryWithStatsWriteUsecase({
  now: () => 1_735_689_600_000,
  generateHistoryId: () => "hs_template_guard",
  async getTemplate() {
    return { item: undefined };
  },
  async transactWriteItems() {
    return { ok: true };
  },
});

let itemShapeNotFoundCode = null;
try {
  await usecase.create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
  });
} catch (error) {
  itemShapeNotFoundCode = error?.code ?? null;
}

const usecaseWithLowerItem = createHistoryWithStatsWriteUsecase({
  now: () => 1_735_689_600_000,
  generateHistoryId: () => "hs_item_lower",
  async getTemplate() {
    return {
      item: {
        status: "ACTIVE",
        clothingIds: ["cl_001", "cl_002", "cl_002"],
      },
    };
  },
  async transactWriteItems(items) {
    return { ok: true, items };
  },
});

const lowerItemResult = await usecaseWithLowerItem.create({
  wardrobeId: "wd_001",
  date: "20260101",
  templateId: "tp_001",
});

let deletedTemplateCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    now: () => 1_735_689_600_000,
    generateHistoryId: () => "hs_deleted",
    async getTemplate() {
      return {
        Item: {
          status: "DELETED",
          clothingIds: ["cl_001"],
        },
      };
    },
    async transactWriteItems() {
      return { ok: true };
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
  });
} catch (error) {
  deletedTemplateCode = error?.code ?? null;
}

let invalidClothingIdsCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    now: () => 1_735_689_600_000,
    generateHistoryId: () => "hs_invalid",
    async getTemplate() {
      return {
        Item: {
          status: "ACTIVE",
          clothingIds: ["cl_001", 100],
        },
      };
    },
    async transactWriteItems() {
      return { ok: true };
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
  });
} catch (error) {
  invalidClothingIdsCode = error?.code ?? null;
}

let missingClothingIdsCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    now: () => 1_735_689_600_000,
    generateHistoryId: () => "hs_missing",
    async getTemplate() {
      return {
        Item: {
          status: "ACTIVE",
        },
      };
    },
    async transactWriteItems() {
      return { ok: true };
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
  });
} catch (error) {
  missingClothingIdsCode = error?.code ?? null;
}

let emptyClothingIdsCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    now: () => 1_735_689_600_000,
    generateHistoryId: () => "hs_empty",
    async getTemplate() {
      return {
        Item: {
          status: "ACTIVE",
          clothingIds: [],
        },
      };
    },
    async transactWriteItems() {
      return { ok: true };
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
  });
} catch (error) {
  emptyClothingIdsCode = error?.code ?? null;
}

let passthroughNotFoundCode = null;
let passthroughValidationCode = null;
try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260101", templateId: "tp_missing" },
    headers: { "content-type": "application/json" },
    dependencies: {
      async getTemplate() {
        return { Item: undefined };
      },
      async transactWriteItems() {
        return { ok: true };
      },
    },
  });
} catch (error) {
  passthroughNotFoundCode = error?.code ?? null;
}

try {
  await createHistoryHandler({
    path: { wardrobeId: "wd_001" },
    body: { date: "20260101", templateId: "tp_invalid" },
    headers: { "content-type": "application/json" },
    dependencies: {
      async getTemplate() {
        return {
          Item: {
            status: "ACTIVE",
            clothingIds: [1],
          },
        };
      },
      async transactWriteItems() {
        return { ok: true };
      },
    },
  });
} catch (error) {
  passthroughValidationCode = error?.code ?? null;
}

const checks = [
  {
    name: "template get result extraction handles lowercase item and resolves create success",
    ok: lowerItemResult.historyId === "hs_item_lower",
    detail: lowerItemResult,
  },
  {
    name: "template missing or non-active resolves to NOT_FOUND",
    ok: itemShapeNotFoundCode === "NOT_FOUND" && deletedTemplateCode === "NOT_FOUND",
    detail: { itemShapeNotFoundCode, deletedTemplateCode },
  },
  {
    name: "template clothingIds missing / empty / invalid type resolves to VALIDATION_ERROR",
    ok:
      missingClothingIdsCode === "VALIDATION_ERROR"
      && emptyClothingIdsCode === "VALIDATION_ERROR"
      && invalidClothingIdsCode === "VALIDATION_ERROR",
    detail: { missingClothingIdsCode, emptyClothingIdsCode, invalidClothingIdsCode },
  },
  {
    name: "createHistoryHandler keeps TransactionCanceledException normalization and passes through NOT_FOUND/VALIDATION_ERROR",
    ok: passthroughNotFoundCode === "NOT_FOUND" && passthroughValidationCode === "VALIDATION_ERROR",
    detail: { passthroughNotFoundCode, passthroughValidationCode },
  },
  {
    name: "source and CI wiring are present",
    ok:
      usecaseSource.includes("extractTemplateClothingIds")
      && handlerSource.includes("TransactionCanceledException")
      && packageJson.includes('"test:history-template-source-guard": "node --import tsx/esm scripts/check-history-template-source-guard-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-template-source-guard"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("History template source guard spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("History template source guard spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
