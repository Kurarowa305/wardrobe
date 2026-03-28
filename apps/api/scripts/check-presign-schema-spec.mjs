import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const schemaModulePath = path.join(root, "src/domains/presign/schema/presignSchema.ts");
const dtoModulePath = path.join(root, "src/domains/presign/dto/presignDto.ts");
const entityModulePath = path.join(root, "src/domains/presign/entities/presign.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const schemaModule = await import(schemaModulePath);
const entityModule = await import(entityModulePath);
const schemaSource = readFileSync(schemaModulePath, "utf8");
const dtoSource = readFileSync(dtoModulePath, "utf8");
const entitySource = readFileSync(entityModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const parsedRequest = schemaModule.createPresignRequestSchema.parse({
  contentType: "image/jpeg",
  category: "clothing",
  extension: "jpg",
});

const parsedRequestWithoutExtension = schemaModule.createPresignRequestSchema.parse({
  contentType: "image/webp",
  category: "template",
});

const parsedResponse = schemaModule.createPresignResponseSchema.parse({
  imageKey: "template/wd_01HZZAAA/01JABCDEF.webp",
  uploadUrl: "https://example-bucket.s3.ap-northeast-1.amazonaws.com/template/wd_01HZZAAA/01JABCDEF.webp?X-Amz-Signature=test",
  method: "PUT",
  expiresAt: "2026-03-28T00:00:00Z",
});

let invalidContentTypeError;
try {
  schemaModule.createPresignRequestSchema.parse({
    contentType: "application/json",
    category: "clothing",
  });
} catch (error) {
  invalidContentTypeError = error;
}

let invalidCategoryError;
try {
  schemaModule.createPresignRequestSchema.parse({
    contentType: "image/png",
    category: "history",
  });
} catch (error) {
  invalidCategoryError = error;
}

assert.ok(invalidContentTypeError instanceof Error);
assert.ok(invalidCategoryError instanceof Error);

const checks = [
  {
    name: "presign request schema が contentType/category/extension を検証できる",
    ok:
      parsedRequest.contentType === "image/jpeg" &&
      parsedRequest.category === "clothing" &&
      parsedRequest.extension === "jpg" &&
      parsedRequestWithoutExtension.extension === undefined,
    detail: { parsedRequest, parsedRequestWithoutExtension },
  },
  {
    name: "presign response schema が imageKey/uploadUrl/method/expiresAt を検証できる",
    ok:
      parsedResponse.imageKey.startsWith("template/") &&
      parsedResponse.uploadUrl.includes("X-Amz-Signature=") &&
      parsedResponse.method === "PUT" &&
      parsedResponse.expiresAt === "2026-03-28T00:00:00Z",
    detail: parsedResponse,
  },
  {
    name: "category 内部型として prefix map と発行入出力型を定義している",
    ok:
      entityModule.presignCategoryPrefixMap.clothing === "clothing" &&
      entityModule.presignCategoryPrefixMap.template === "template" &&
      entitySource.includes("export type PresignIssueInput") &&
      entitySource.includes("export type PresignIssueResult"),
    detail: entityModule.presignCategoryPrefixMap,
  },
  {
    name: "schema/dto から presign の型定義を export している",
    ok:
      schemaSource.includes("export const createPresignRequestSchema") &&
      schemaSource.includes("export const createPresignResponseSchema") &&
      schemaSource.includes("export type PresignCategory") &&
      dtoSource.includes("export type CreatePresignRequestDto") &&
      dtoSource.includes("export type CreatePresignResponseDto"),
    detail: { schemaSource, dtoSource },
  },
  {
    name: "package script と CI に BE-MS6-T01 テスト導線がある",
    ok:
      packageJson.includes('"test:presign-schema": "node --import tsx/esm scripts/check-presign-schema-spec.mjs"') &&
      packageJson.includes("pnpm run test:presign-schema") &&
      ciSource.includes("pnpm --filter api test:presign-schema"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS6-T01 presign schema/category spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS6-T01 presign schema/category spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
