import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/history/usecases/createHistoryWithStatsWrite.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createHistoryWithStatsWriteUsecase } = await import(usecaseModulePath);

const transactCalls = [];
const usecase = createHistoryWithStatsWriteUsecase({
  now: () => 1735689600000,
  generateHistoryId: () => "hs_custom",
  async transactWriteItems(items) {
    transactCalls.push(items);
    return { ok: true };
  },
});

const createdFromTemplate = await usecase.create({
  wardrobeId: "wd_001",
  date: "20260101",
  templateId: "tp_001",
});

const createdFromClothing = await usecase.create({
  wardrobeId: "wd_001",
  date: "20260102",
  clothingIds: ["cl_001", "cl_002"],
});

let conflictCode = null;
try {
  await usecase.create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_001",
    clothingIds: ["cl_001"],
  });
} catch (error) {
  conflictCode = error?.code ?? null;
}

let duplicateCode = null;
try {
  await usecase.create({
    wardrobeId: "wd_001",
    date: "20260101",
    clothingIds: ["cl_001", "cl_001"],
  });
} catch (error) {
  duplicateCode = error?.code ?? null;
}

const templateCall = transactCalls[0] ?? [];
const clothingCall = transactCalls[1] ?? [];

const hasHistoryPut = (items) =>
  items.some((item) => item?.Put?.Item?.historyId === "hs_custom" && item?.Put?.ConditionExpression?.includes("attribute_not_exists"));

const hasTemplateConditionCheck = (items) =>
  items.some((item) => item?.ConditionCheck?.Key?.SK === "TPL#tp_001" && item?.ConditionCheck?.ConditionExpression === "attribute_exists(PK)");

const hasClothingConditionChecks = (items) =>
  items.filter((item) => item?.ConditionCheck?.Key?.SK?.startsWith("CLOTH#")).length === 2;

const hasStatsWriteUpdates = (items) =>
  items.some((item) => item?.Update?.Key?.PK?.includes("#COUNT#"))
  && items.some((item) => item?.Update?.UpdateExpression?.includes("wearCount"));

const checks = [
  {
    name: "API-14 usecase returns generated historyId",
    ok: createdFromTemplate.historyId === "hs_custom" && createdFromClothing.historyId === "hs_custom",
    detail: { createdFromTemplate, createdFromClothing },
  },
  {
    name: "API-14 usecase rejects templateId and clothingIds simultaneous input with CONFLICT",
    ok: conflictCode === "CONFLICT",
    detail: conflictCode,
  },
  {
    name: "API-14 usecase rejects duplicate clothingIds with CONFLICT",
    ok: duplicateCode === "CONFLICT",
    detail: duplicateCode,
  },
  {
    name: "API-14 template flow builds one transact with history Put + template existence check + stats updates",
    ok:
      hasHistoryPut(templateCall)
      && hasTemplateConditionCheck(templateCall)
      && hasStatsWriteUpdates(templateCall),
    detail: templateCall,
  },
  {
    name: "API-14 clothing flow builds one transact with history Put + clothing existence checks + stats updates",
    ok:
      hasHistoryPut(clothingCall)
      && hasClothingConditionChecks(clothingCall)
      && hasStatsWriteUpdates(clothingCall),
    detail: clothingCall,
  },
  {
    name: "source exports API-14 usecase and package / CI wiring",
    ok:
      source.includes("export function createHistoryWithStatsWriteUsecase")
      && packageJson.includes('"test:history-ms5-api14-usecase": "node --import tsx/esm scripts/check-history-ms5-api14-usecase-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-ms5-api14-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T09 API-14 usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T09 API-14 usecase spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
