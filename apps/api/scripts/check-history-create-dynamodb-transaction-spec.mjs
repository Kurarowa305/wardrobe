import assert from "node:assert/strict";
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
  now: () => 1_735_689_600_000,
  generateHistoryId: () => "hs_tx_guard",
  async transactWriteItems(items) {
    transactCalls.push(items);
    return { ok: true };
  },
});

await usecase.create({
  wardrobeId: "wd_001",
  date: "20260101",
  templateId: "tp_001",
});

await usecase.create({
  wardrobeId: "wd_001",
  date: "20260102",
  clothingIds: ["cl_001", "cl_002"],
});

const templateCall = transactCalls[0] ?? [];
const clothingCall = transactCalls[1] ?? [];

const resolveOperationKey = (item) => {
  const key = item?.ConditionCheck?.Key
    ?? item?.Delete?.Key
    ?? item?.Update?.Key
    ?? (item?.Put?.Item ? { PK: item.Put.Item.PK, SK: item.Put.Item.SK } : null);

  return key?.PK && key?.SK ? `${key.PK}|${key.SK}` : null;
};

const findDuplicateOperationKeys = (items) => {
  const seen = new Set();
  const duplicates = [];

  for (const key of items.map(resolveOperationKey).filter(Boolean)) {
    if (seen.has(key)) {
      duplicates.push(key);
      continue;
    }

    seen.add(key);
  }

  return duplicates;
};

const hasNoConditionChecks = (items) => items.every((item) => item?.ConditionCheck === undefined);

const hasTemplateExistenceGuardOnUpdate = (items) =>
  items.some((item) => item?.Update?.Key?.SK === "TPL#tp_001" && item?.Update?.ConditionExpression === "attribute_exists(PK)");

const hasClothingExistenceGuardsOnUpdate = (items) =>
  items.filter((item) => item?.Update?.Key?.SK?.startsWith("CLOTH#") && item?.Update?.ConditionExpression === "attribute_exists(PK)")
    .length === 2;

const templateDuplicateKeys = findDuplicateOperationKeys(templateCall);
const clothingDuplicateKeys = findDuplicateOperationKeys(clothingCall);

const checks = [
  {
    name: "履歴作成トランザクションは template 記録で ConditionCheck を使わない",
    ok: hasNoConditionChecks(templateCall) && hasTemplateExistenceGuardOnUpdate(templateCall),
    detail: templateCall,
  },
  {
    name: "履歴作成トランザクションは clothing 記録で ConditionCheck を使わない",
    ok: hasNoConditionChecks(clothingCall) && hasClothingExistenceGuardsOnUpdate(clothingCall),
    detail: clothingCall,
  },
  {
    name: "履歴作成トランザクションは同一 item への複数操作を含まない",
    ok: templateDuplicateKeys.length === 0 && clothingDuplicateKeys.length === 0,
    detail: { templateDuplicateKeys, clothingDuplicateKeys, templateCall, clothingCall },
  },
  {
    name: "ユースケース実装から ConditionCheck ベースの参照確認が除去されている",
    ok:
      !source.includes("buildReferenceConditionChecks")
      && !source.includes("ConditionCheck: {"),
    detail: source,
  },
  {
    name: "package script と CI に回帰テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-create-dynamodb-transaction": "node --import tsx/esm scripts/check-history-create-dynamodb-transaction-spec.mjs"',
      )
      && packageJson.includes("pnpm run test:history-create-dynamodb-transaction")
      && ciSource.includes("pnpm --filter api test:history-create-dynamodb-transaction"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("history create dynamodb transaction spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("history create dynamodb transaction spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
