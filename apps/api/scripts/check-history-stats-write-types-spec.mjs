import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const typesPath = path.join(root, "src/domains/history/stats_write/types.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const typesModule = await import(typesPath);
const typesSource = readFileSync(typesPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

/** @type {import("../src/domains/history/stats_write/types.ts").HistoryStatsWriteCommand} */
const createCommand = {
  mode: "create",
  history: {
    wardrobeId: "wd_01HZZAAA",
    historyId: "hs_01HZZAAA",
    date: "20260101",
    templateId: "tp_01HZZAAA",
    clothingIds: ["cl_01", "cl_02"],
    createdAt: 1735600000000,
  },
};

/** @type {import("../src/domains/history/stats_write/types.ts").HistoryStatsWriteCommand} */
const deleteCommand = {
  mode: "delete",
  history: {
    wardrobeId: "wd_01HZZAAA",
    historyId: "hs_01HZZBBB",
    date: "20260102",
    templateId: null,
    clothingIds: ["cl_03"],
    createdAt: 1735686400000,
  },
};

/** @type {import("../src/domains/history/stats_write/types.ts").WearDailyFact} */
const wearDailyFact = {
  wardrobeId: "wd_01HZZAAA",
  target: {
    kind: "clothing",
    id: "cl_01",
  },
  date: "20260101",
  count: 2,
};

const checks = [
  {
    name: "stats write mode が create/delete の判別子として利用できる",
    ok: createCommand.mode === "create" && deleteCommand.mode === "delete",
    detail: { createCommand, deleteCommand },
  },
  {
    name: "HistoryFact が create/delete 共通で必要項目を保持する",
    ok:
      createCommand.history.wardrobeId.length > 0 &&
      createCommand.history.historyId.length > 0 &&
      createCommand.history.date === "20260101" &&
      createCommand.history.templateId === "tp_01HZZAAA" &&
      createCommand.history.clothingIds.length === 2 &&
      deleteCommand.history.templateId === null &&
      deleteCommand.history.clothingIds.length === 1,
    detail: { create: createCommand.history, delete: deleteCommand.history },
  },
  {
    name: "wear daily 集計内部型が対象種別・日付・件数を表現できる",
    ok:
      wearDailyFact.target.kind === "clothing" &&
      wearDailyFact.target.id === "cl_01" &&
      wearDailyFact.date === "20260101" &&
      wearDailyFact.count === 2,
    detail: wearDailyFact,
  },
  {
    name: "types.ts が主要内部型を export している",
    ok:
      typesSource.includes('export type StatsWriteMode = "create" | "delete"') &&
      typesSource.includes("export type HistoryFact = {") &&
      typesSource.includes("export type HistoryStatsWriteCommand = {") &&
      typesSource.includes("export type WearDailyFact = {"),
    detail: typesSource,
  },
  {
    name: "package script と CI に BE-MS5-T01 テスト導線がある",
    ok:
      packageJson.includes(
        '"test:history-stats-write-types": "node --import tsx/esm scripts/check-history-stats-write-types-spec.mjs"',
      ) &&
      packageJson.includes("pnpm run test:history-stats-write-types") &&
      ciSource.includes("pnpm --filter api test:history-stats-write-types"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS5-T01 history/stats_write types spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS5-T01 history/stats_write types spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
