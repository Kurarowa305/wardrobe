import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const usecaseModulePath = path.join(root, "src/domains/presign/usecases/presignUsecase.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const usecaseModule = await import(usecaseModulePath);
const source = readFileSync(usecaseModulePath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const presignCalls = [];
const buildImageKeyCalls = [];

const usecase = usecaseModule.createPresignUsecase({
  buildImageKey(input) {
    buildImageKeyCalls.push(input);
    return "clothing/wd_01HZZAAA/01JABCDEF123.jpg";
  },
  s3Client: {
    async presignPutObject(input) {
      presignCalls.push(input);
      return {
        bucket: "wardrobe-dev-images",
        key: input.key,
        method: "PUT",
        uploadUrl: "https://localhost:4566/wardrobe-dev-images/clothing/wd_01HZZAAA/01JABCDEF123.jpg?X-Amz-Signature=test",
        publicUrl: "http://localhost:4000/images/clothing/wd_01HZZAAA/01JABCDEF123.jpg",
        expiresAt: "2026-03-28T00:10:00.000Z",
        request: {
          operation: "PutObject",
          region: "ap-northeast-1",
          bucket: "wardrobe-dev-images",
          storageDriver: "local",
          input: {
            Bucket: "wardrobe-dev-images",
            Key: input.key,
            ContentType: input.contentType,
            ExpiresIn: 600,
          },
        },
      };
    },
  },
});

const issued = await usecase.issue({
  wardrobeId: "wd_01HZZAAA",
  contentType: "image/jpeg",
  category: "clothing",
});

const checks = [
  {
    name: "presign usecase が imageKey/uploadUrl/method/expiresAt を返す",
    ok:
      issued.imageKey === "clothing/wd_01HZZAAA/01JABCDEF123.jpg"
      && issued.uploadUrl.includes("X-Amz-Signature=")
      && issued.method === "PUT"
      && issued.expiresAt === "2026-03-28T00:10:00.000Z",
    detail: issued,
  },
  {
    name: "presign usecase が buildPresignImageKey と S3 presign を連携できる",
    ok:
      buildImageKeyCalls.length === 1
      && buildImageKeyCalls[0]?.wardrobeId === "wd_01HZZAAA"
      && presignCalls.length === 1
      && presignCalls[0]?.key === "clothing/wd_01HZZAAA/01JABCDEF123.jpg"
      && presignCalls[0]?.contentType === "image/jpeg",
    detail: { buildImageKeyCalls, presignCalls },
  },
  {
    name: "source と package script/CI に BE-MS6-T03 テスト導線がある",
    ok:
      source.includes("export function createPresignUsecase")
      && source.includes("async issue(input: PresignUsecaseInput)")
      && packageJson.includes('"test:presign-usecase": "node --import tsx/esm scripts/check-presign-usecase-spec.mjs"')
      && packageJson.includes("pnpm run test:presign-usecase")
      && ciSource.includes("pnpm --filter api test:presign-usecase"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS6-T03 presign usecase spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS6-T03 presign usecase spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
