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
let transactCount = 0;
const usecase = createHistoryWithStatsWriteUsecase({
  now: () => 1_735_689_600_000,
  generateHistoryId: () => "hs_template_snapshot",
  async getTemplate() {
    return {
      Item: {
        templateId: "tp_001",
        clothingIds: ["cl_003", "cl_001", "cl_002"],
      },
    };
  },
  async transactWriteItems(items) {
    transactCount += 1;
    transactCalls.push(items);
    return { ok: true };
  },
});

await usecase.create({
  wardrobeId: "wd_001",
  date: "20260101",
  templateId: "tp_001",
});

const templateCall = transactCalls[0] ?? [];
const historyPut = templateCall.find((item) => item?.Put?.Item?.historyId === "hs_template_snapshot")?.Put?.Item ?? null;

const clothingDailyTargets = templateCall
  .filter((item) => item?.Update?.Key?.PK?.startsWith("W#wd_001#COUNT#CLOTH#"))
  .map((item) => item.Update.Key.PK.split("#").slice(4).join("#"))
  .sort();

const clothingCacheTargets = templateCall
  .filter((item) => item?.Update?.Key?.SK?.startsWith("CLOTH#"))
  .map((item) => item.Update.Key.SK.replace("CLOTH#", ""))
  .sort();

let missingTemplateCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    async getTemplate() {
      return {};
    },
    async transactWriteItems() {
      throw new Error("transactWriteItems should not be called when template is missing");
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_missing",
  });
} catch (error) {
  missingTemplateCode = error?.code ?? null;
}

let invalidTemplateCode = null;
try {
  await createHistoryWithStatsWriteUsecase({
    async getTemplate() {
      return {
        Item: {
          templateId: "tp_invalid",
        },
      };
    },
    async transactWriteItems() {
      throw new Error("transactWriteItems should not be called when template data is invalid");
    },
  }).create({
    wardrobeId: "wd_001",
    date: "20260101",
    templateId: "tp_invalid",
  });
} catch (error) {
  invalidTemplateCode = error?.code ?? null;
}

const checks = [
  {
    name: "template record persists template clothingIds to history Put in original order",
    ok:
      Array.isArray(historyPut?.clothingIds)
      && historyPut.clothingIds.join(",") === "cl_003,cl_001,cl_002"
      && historyPut.templateId === "tp_001",
    detail: historyPut,
  },
  {
    name: "template record builds clothing wearDaily and clothing cache updates from persisted clothingIds",
    ok:
      clothingDailyTargets.join(",") === "cl_001,cl_002,cl_003"
      && clothingCacheTargets.join(",") === "cl_001,cl_002,cl_003",
    detail: templateCall,
  },
  {
    name: "missing template fails with NOT_FOUND before transact write",
    ok: missingTemplateCode === "NOT_FOUND" && transactCount === 1,
    detail: { missingTemplateCode, transactCount },
  },
  {
    name: "invalid template snapshot fails with INTERNAL_ERROR before transact write",
    ok: invalidTemplateCode === "INTERNAL_ERROR" && transactCount === 1,
    detail: { invalidTemplateCode, transactCount },
  },
  {
    name: "source exports template snapshot logic and package / CI wiring",
    ok:
      source.includes("getTemplate?: ((input: { wardrobeId: string; templateId: string }) => Promise<unknown>) | undefined;")
      && source.includes("Template clothingIds is invalid.")
      && packageJson.includes('"test:history-template-record-clothing-ids": "node --import tsx/esm scripts/check-history-template-record-clothing-ids-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-template-record-clothing-ids"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history template record clothingIds spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("history template record clothingIds spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
