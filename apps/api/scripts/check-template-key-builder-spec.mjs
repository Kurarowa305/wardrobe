import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const modulePath = path.join(root, "src/domains/template/repo/templateKeys.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(modulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const keyModule = await import(modulePath);

const baseKey = keyModule.buildTemplateBaseKey({
  wardrobeId: "wd_01HZZAAA",
  templateId: "tp_01HZZBBB",
});
const statusListPk = keyModule.buildTemplateStatusListPk({
  wardrobeId: "wd_01HZZAAA",
  status: "ACTIVE",
});
const createdAtSk = keyModule.buildTemplateCreatedAtSk({
  templateId: "tp_01HZZBBB",
  value: 1735690000123,
});
const wearCountSk = keyModule.buildTemplateWearCountSk({
  templateId: "tp_01HZZBBB",
  value: 12,
});
const lastWornAtSk = keyModule.buildTemplateLastWornAtSk({
  templateId: "tp_01HZZBBB",
  value: 1735600000000,
});
const compositeKeys = keyModule.buildTemplateIndexKeys({
  wardrobeId: "wd_01HZZAAA",
  templateId: "tp_01HZZBBB",
  status: "DELETED",
  createdAt: 1735690000123,
  wearCount: 12,
  lastWornAt: 1735600000000,
});

const checks = [
  {
    name: "base table key uses W#<wardrobeId>#TPL and TPL#<templateId>",
    ok: baseKey.PK === "W#wd_01HZZAAA#TPL" && baseKey.SK === "TPL#tp_01HZZBBB",
    detail: baseKey,
  },
  {
    name: "status list pk uses wardrobe template partition and status",
    ok: statusListPk === "W#wd_01HZZAAA#TPL#ACTIVE",
    detail: statusListPk,
  },
  {
    name: "createdAt and lastWornAt sort keys preserve raw unix-ms values",
    ok:
      createdAtSk === "CREATED#1735690000123#tp_01HZZBBB" &&
      lastWornAtSk === "LASTWORN#1735600000000#tp_01HZZBBB",
    detail: { createdAtSk, lastWornAtSk },
  },
  {
    name: "wearCount sort key is zero-padded for lexicographic sorting",
    ok: wearCountSk === "WEAR#0000000012#tp_01HZZBBB",
    detail: wearCountSk,
  },
  {
    name: "composite builder returns base and all GSI key attributes for repo updates",
    ok:
      compositeKeys.PK === "W#wd_01HZZAAA#TPL" &&
      compositeKeys.SK === "TPL#tp_01HZZBBB" &&
      compositeKeys.statusListPk === "W#wd_01HZZAAA#TPL#DELETED" &&
      compositeKeys.createdAtSk === "CREATED#1735690000123#tp_01HZZBBB" &&
      compositeKeys.wearCountSk === "WEAR#0000000012#tp_01HZZBBB" &&
      compositeKeys.lastWornAtSk === "LASTWORN#1735600000000#tp_01HZZBBB",
    detail: compositeKeys,
  },
  {
    name: "source exports template key builders and package script plus CI wiring",
    ok:
      source.includes("export function buildTemplateBaseKey") &&
      source.includes("export function buildTemplateStatusListPk") &&
      source.includes("export function buildTemplateIndexKeys") &&
      packageJson.includes('"test:template-key-builder": "node --import tsx/esm scripts/check-template-key-builder-spec.mjs"') &&
      packageJson.includes("pnpm run test:template-key-builder") &&
      ciSource.includes("pnpm --filter api test:template-key-builder"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS3-T02 template key builder spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS3-T02 template key builder spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
