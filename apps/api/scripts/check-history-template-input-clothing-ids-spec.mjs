import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/history/usecases/createHistoryWithStatsWrite.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const testDesignPath = path.join(root, "../../design/テスト設計/テンプレート入力履歴_服ID補完テスト設計.md");

const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const testDesignSource = readFileSync(testDesignPath, "utf8");

const { createHistoryWithStatsWriteUsecase } = await import(usecaseModulePath);

const transactCalls = [];
const usecase = createHistoryWithStatsWriteUsecase({
  now: () => 1735689600000,
  generateHistoryId: () => "hs_template_snapshot",
  templateRepo: {
    async get() {
      return {
        Item: {
          clothingIds: ["cl_tops", "cl_bottoms"],
        },
      };
    },
  },
  async transactWriteItems(items) {
    transactCalls.push(items);
    return { ok: true };
  },
});

await usecase.create({
  wardrobeId: "wd_001",
  date: "20260103",
  templateId: "tp_001",
});

const templateCall = transactCalls[0] ?? [];
const historyPutItem = templateCall.find((item) => item?.Put?.Item?.historyId === "hs_template_snapshot")?.Put?.Item;

let notFoundCode = null;
const missingTemplateUsecase = createHistoryWithStatsWriteUsecase({
  templateRepo: {
    async get() {
      return {};
    },
  },
  async transactWriteItems() {
    return { ok: true };
  },
});

try {
  await missingTemplateUsecase.create({
    wardrobeId: "wd_001",
    date: "20260103",
    templateId: "tp_missing",
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

const checks = [
  {
    name: "template入力時に履歴へ templateId と template由来 clothingIds を保存する",
    ok:
      historyPutItem?.templateId === "tp_001"
      && Array.isArray(historyPutItem?.clothingIds)
      && historyPutItem.clothingIds.length === 2
      && historyPutItem.clothingIds[0] === "cl_tops"
      && historyPutItem.clothingIds[1] === "cl_bottoms",
    detail: historyPutItem,
  },
  {
    name: "template入力時のトランザクションに服統計更新が含まれる",
    ok: templateCall.filter((item) => item?.Update?.Key?.SK?.startsWith("CLOTH#")).length === 2,
    detail: templateCall,
  },
  {
    name: "templateが見つからない場合に NOT_FOUND を返す",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "source / package / CI / test design の導線が揃っている",
    ok:
      source.includes("templateRepo.get")
      && source.includes("extractTemplateClothingIds")
      && packageJson.includes('"test:history-template-input-clothing-ids": "node --import tsx/esm scripts/check-history-template-input-clothing-ids-spec.mjs"')
      && ciSource.includes("pnpm --filter api test:history-template-input-clothing-ids")
      && testDesignSource.includes("check-history-template-input-clothing-ids-spec.mjs"),
    detail: { packageJson, ciSource, testDesignSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history template input clothingIds spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("history template input clothingIds spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
