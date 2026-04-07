import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const modulePath = path.join(root, "src/domains/clothing/repo/clothingKeys.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");
const source = readFileSync(modulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");
const keyModule = await import(modulePath);

const baseKey = keyModule.buildClothingBaseKey({
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZBBB",
});
const statusListPk = keyModule.buildClothingStatusListPk({
  wardrobeId: "wd_01HZZAAA",
  status: "ACTIVE",
});
const statusGenreListPk = keyModule.buildClothingStatusGenreListPk({
  wardrobeId: "wd_01HZZAAA",
  status: "ACTIVE",
  genre: "tops",
});
const createdAtSk = keyModule.buildClothingCreatedAtSk({
  clothingId: "cl_01HZZBBB",
  value: 1735690000123,
});
const wearCountSk = keyModule.buildClothingWearCountSk({
  clothingId: "cl_01HZZBBB",
  value: 12,
});
const lastWornAtSk = keyModule.buildClothingLastWornAtSk({
  clothingId: "cl_01HZZBBB",
  value: 1735600000000,
});
const compositeKeys = keyModule.buildClothingIndexKeys({
  wardrobeId: "wd_01HZZAAA",
  clothingId: "cl_01HZZBBB",
  genre: "tops",
  status: "DELETED",
  createdAt: 1735690000123,
  wearCount: 12,
  lastWornAt: 1735600000000,
});

const checks = [
  {
    name: "base table key uses W#<wardrobeId>#CLOTH and CLOTH#<clothingId>",
    ok: baseKey.PK === "W#wd_01HZZAAA#CLOTH" && baseKey.SK === "CLOTH#cl_01HZZBBB",
    detail: baseKey,
  },
  {
    name: "status list pk and status+genre list pk can be generated",
    ok:
      statusListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE" &&
      statusGenreListPk === "W#wd_01HZZAAA#CLOTH#ACTIVE#GENRE#tops",
    detail: { statusListPk, statusGenreListPk },
  },
  {
    name: "createdAt and lastWornAt sort keys preserve raw unix-ms values",
    ok:
      createdAtSk === "CREATED#1735690000123#cl_01HZZBBB" &&
      lastWornAtSk === "LASTWORN#1735600000000#cl_01HZZBBB",
    detail: { createdAtSk, lastWornAtSk },
  },
  {
    name: "wearCount sort key is zero-padded for lexicographic sorting",
    ok: wearCountSk === "WEAR#0000000012#cl_01HZZBBB",
    detail: wearCountSk,
  },
  {
    name: "composite builder returns base and all GSI key attributes for repo updates",
    ok:
      compositeKeys.PK === "W#wd_01HZZAAA#CLOTH" &&
      compositeKeys.SK === "CLOTH#cl_01HZZBBB" &&
      compositeKeys.statusListPk === "W#wd_01HZZAAA#CLOTH#DELETED" &&
      compositeKeys.statusGenreListPk === "W#wd_01HZZAAA#CLOTH#DELETED#GENRE#tops" &&
      compositeKeys.createdAtSk === "CREATED#1735690000123#cl_01HZZBBB" &&
      compositeKeys.wearCountSk === "WEAR#0000000012#cl_01HZZBBB" &&
      compositeKeys.lastWornAtSk === "LASTWORN#1735600000000#cl_01HZZBBB",
    detail: compositeKeys,
  },
  {
    name: "source exports clothing key builders and package script plus CI wiring",
    ok:
      source.includes("export function buildClothingBaseKey") &&
      source.includes("export function buildClothingStatusListPk") &&
      source.includes("export function buildClothingStatusGenreListPk") &&
      source.includes("export function buildClothingIndexKeys") &&
      packageJson.includes('"test:clothing-key-builder": "node --import tsx/esm scripts/check-clothing-key-builder-spec.mjs"') &&
      packageJson.includes("pnpm run test:clothing-key-builder") &&
      ciSource.includes("pnpm --filter api test:clothing-key-builder"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS2-T02 clothing key builder spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS2-T02 clothing key builder spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
