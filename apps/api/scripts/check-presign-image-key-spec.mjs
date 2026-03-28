import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const modulePath = path.join(root, "src/domains/presign/repo/presignImageKey.ts");
const entityModulePath = path.join(root, "src/domains/presign/entities/presign.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const keyModule = await import(modulePath);
const entityModule = await import(entityModulePath);
const source = readFileSync(modulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const explicitExtensionKey = keyModule.buildPresignImageKey(
  {
    wardrobeId: "wd_01HZZAAA",
    category: "clothing",
    contentType: "image/jpeg",
    extension: "jpeg",
  },
  { generateUuid: () => "018fcb4d-3ca7-7d6a-90da-b31a4519cd4e" },
);

const inferredExtensionKey = keyModule.buildPresignImageKey(
  {
    wardrobeId: "wd_01HZZBBB",
    category: "template",
    contentType: "image/png",
  },
  { generateUuid: () => "018fcb4d-3ca7-7d6a-90da-b31a4519cd4f" },
);

const inferredJpegExtension = keyModule.resolvePresignExtension({
  contentType: "image/jpeg",
});

const checks = [
  {
    name: "category ごとに prefix を切って imageKey を生成できる",
    ok:
      explicitExtensionKey.startsWith("clothing/") &&
      inferredExtensionKey.startsWith("template/") &&
      entityModule.presignCategoryPrefixMap.clothing === "clothing" &&
      entityModule.presignCategoryPrefixMap.template === "template",
    detail: { explicitExtensionKey, inferredExtensionKey },
  },
  {
    name: "wardrobeId を imageKey に含めて category/wardrobeId/uuid.extension 形式で組み立てる",
    ok:
      explicitExtensionKey === "clothing/wd_01HZZAAA/018fcb4d-3ca7-7d6a-90da-b31a4519cd4e.jpeg" &&
      inferredExtensionKey === "template/wd_01HZZBBB/018fcb4d-3ca7-7d6a-90da-b31a4519cd4f.png",
    detail: { explicitExtensionKey, inferredExtensionKey },
  },
  {
    name: "extension 未指定時は contentType から拡張子を推定できる",
    ok: inferredJpegExtension === "jpg",
    detail: inferredJpegExtension,
  },
  {
    name: "source と package script/CI に BE-MS6-T02 テスト導線がある",
    ok:
      source.includes("export function buildPresignImageKey") &&
      source.includes("export function resolvePresignExtension") &&
      packageJson.includes('"test:presign-image-key": "node --import tsx/esm scripts/check-presign-image-key-spec.mjs"') &&
      packageJson.includes("pnpm run test:presign-image-key") &&
      ciSource.includes("pnpm --filter api test:presign-image-key"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS6-T02 presign image key builder spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS6-T02 presign image key builder spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
