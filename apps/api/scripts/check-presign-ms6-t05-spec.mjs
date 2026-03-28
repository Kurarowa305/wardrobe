import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const keyModulePath = path.join(root, "src/domains/presign/repo/presignImageKey.ts");
const usecaseModulePath = path.join(root, "src/domains/presign/usecases/presignUsecase.ts");
const handlerModulePath = path.join(root, "src/domains/presign/handlers/createPresignHandler.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const keyModule = await import(keyModulePath);
const usecaseModule = await import(usecaseModulePath);
const handlerModule = await import(handlerModulePath);

const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const builtImageKey = keyModule.buildPresignImageKey(
  {
    wardrobeId: "wd_01MS6T05",
    category: "clothing",
    contentType: "image/jpeg",
  },
  { generateUuid: () => "018fcb4d-3ca7-7d6a-90da-b31a4519ff01" },
);

const usecaseBuildCalls = [];
const usecasePresignCalls = [];
const presignUsecase = usecaseModule.createPresignUsecase({
  buildImageKey(input) {
    usecaseBuildCalls.push(input);
    return builtImageKey;
  },
  s3Client: {
    async presignPutObject(input) {
      usecasePresignCalls.push(input);
      return {
        bucket: "wardrobe-dev-images",
        key: input.key,
        method: "PUT",
        uploadUrl: "https://localhost:4566/wardrobe-dev-images/clothing/wd_01MS6T05/018fcb4d-3ca7-7d6a-90da-b31a4519ff01.jpg?X-Amz-Signature=test",
        publicUrl: "http://localhost:4000/images/clothing/wd_01MS6T05/018fcb4d-3ca7-7d6a-90da-b31a4519ff01.jpg",
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

const issued = await presignUsecase.issue({
  wardrobeId: "wd_01MS6T05",
  contentType: "image/jpeg",
  category: "clothing",
});

const successResponse = await handlerModule.createPresignHandler({
  path: { wardrobeId: "wd_01MS6T05" },
  body: {
    contentType: "image/jpeg",
    category: "clothing",
  },
  headers: { "content-type": "application/json" },
  requestId: "req_ms6_t05_ok",
  dependencies: {
    wardrobeRepo: {
      async create() {
        return { ok: true };
      },
      async get() {
        return {
          Item: {
            PK: "W#wd_01MS6T05",
            SK: "META",
            wardrobeId: "wd_01MS6T05",
            name: "MS6 Closet",
            createdAt: 1735689600000,
          },
        };
      },
    },
    presign: {
      buildImageKey() {
        return builtImageKey;
      },
      s3Client: {
        async presignPutObject(input) {
          return {
            bucket: "wardrobe-dev-images",
            key: input.key,
            method: "PUT",
            uploadUrl: "https://localhost:4566/wardrobe-dev-images/clothing/wd_01MS6T05/018fcb4d-3ca7-7d6a-90da-b31a4519ff01.jpg?X-Amz-Signature=test",
            publicUrl: "http://localhost:4000/images/clothing/wd_01MS6T05/018fcb4d-3ca7-7d6a-90da-b31a4519ff01.jpg",
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
    },
  },
});

let invalidMimeCode = null;
try {
  await handlerModule.createPresignHandler({
    path: { wardrobeId: "wd_01MS6T05" },
    body: {
      contentType: "application/json",
      category: "clothing",
    },
    headers: { "content-type": "application/json" },
    requestId: "req_ms6_t05_invalid_mime",
  });
} catch (error) {
  invalidMimeCode = error?.code ?? null;
}

let invalidCategoryCode = null;
try {
  await handlerModule.createPresignHandler({
    path: { wardrobeId: "wd_01MS6T05" },
    body: {
      contentType: "image/png",
      category: "invalid",
    },
    headers: { "content-type": "application/json" },
    requestId: "req_ms6_t05_invalid_category",
  });
} catch (error) {
  invalidCategoryCode = error?.code ?? null;
}

const successBody = JSON.parse(successResponse.body);

const checks = [
  {
    name: "repo が category/wardrobeId/uuid.extension 形式の imageKey を生成できる",
    ok: builtImageKey === "clothing/wd_01MS6T05/018fcb4d-3ca7-7d6a-90da-b31a4519ff01.jpg",
    detail: builtImageKey,
  },
  {
    name: "usecase が repo 生成 imageKey と S3 presign を連携して正常レスポンスを返す",
    ok:
      issued.imageKey === builtImageKey
      && issued.uploadUrl.includes("X-Amz-Signature=")
      && issued.method === "PUT"
      && issued.expiresAt === "2026-03-28T00:10:00.000Z"
      && usecaseBuildCalls.length === 1
      && usecasePresignCalls.length === 1,
    detail: { issued, usecaseBuildCalls, usecasePresignCalls },
  },
  {
    name: "handler が MIME/type 不正を VALIDATION_ERROR で返せる",
    ok: invalidMimeCode === "VALIDATION_ERROR",
    detail: invalidMimeCode,
  },
  {
    name: "handler が category 不正を VALIDATION_ERROR で返せる",
    ok: invalidCategoryCode === "VALIDATION_ERROR",
    detail: invalidCategoryCode,
  },
  {
    name: "handler が正常レスポンスで imageKey/uploadUrl/method/expiresAt を返せる",
    ok:
      successResponse.statusCode === 200
      && successBody.imageKey === builtImageKey
      && successBody.uploadUrl.includes("X-Amz-Signature=")
      && successBody.method === "PUT"
      && successBody.expiresAt === "2026-03-28T00:10:00.000Z",
    detail: { successResponse, successBody },
  },
  {
    name: "package script と CI に BE-MS6-T05 テスト導線がある",
    ok:
      packageJson.includes('"test:presign-ms6-t05": "node --import tsx/esm scripts/check-presign-ms6-t05-spec.mjs"')
      && packageJson.includes("pnpm run test:presign-ms6-t05")
      && ciSource.includes("pnpm --filter api test:presign-ms6-t05"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS6-T05 presign aggregate spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS6-T05 presign aggregate spec passed");
for (const check of checks) {
  assert.ok(check.ok, check.name);
  console.log(`- ${check.name}`);
}
