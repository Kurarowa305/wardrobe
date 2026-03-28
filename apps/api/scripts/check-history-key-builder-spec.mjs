import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const modulePath = path.join(root, "src/domains/history/repo/historyKeys.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(modulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const keyModule = await import(modulePath);

const baseKey = keyModule.buildHistoryBaseKey({
  wardrobeId: "wd_01HZZAAA",
  historyId: "hs_01HZZBBB",
});
const dateSk = keyModule.buildHistoryDateSk({
  date: "20260101",
  historyId: "hs_01HZZBBB",
});
const compositeKeys = keyModule.buildHistoryIndexKeys({
  wardrobeId: "wd_01HZZAAA",
  historyId: "hs_01HZZBBB",
  date: "20260101",
});

const checks = [
  {
    name: "base table key uses W#<wardrobeId>#HIST and HIST#<historyId>",
    ok: baseKey.PK === "W#wd_01HZZAAA#HIST" && baseKey.SK === "HIST#hs_01HZZBBB",
    detail: baseKey,
  },
  {
    name: "date sort key uses DATE#<date>#<historyId>",
    ok: dateSk === "DATE#20260101#hs_01HZZBBB",
    detail: dateSk,
  },
  {
    name: "composite builder returns base and date index key for list query",
    ok:
      compositeKeys.PK === "W#wd_01HZZAAA#HIST" &&
      compositeKeys.SK === "HIST#hs_01HZZBBB" &&
      compositeKeys.dateSk === "DATE#20260101#hs_01HZZBBB",
    detail: compositeKeys,
  },
  {
    name: "source exports history key builders and package script plus CI wiring",
    ok:
      source.includes("export function buildHistoryBaseKey") &&
      source.includes("export function buildHistoryDateSk") &&
      source.includes("export function buildHistoryIndexKeys") &&
      packageJson.includes('"test:history-key-builder": "node --import tsx/esm scripts/check-history-key-builder-spec.mjs"') &&
      packageJson.includes("pnpm run test:history-key-builder") &&
      ciSource.includes("pnpm --filter api test:history-key-builder"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS4-T02 history key builder spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS4-T02 history key builder spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
