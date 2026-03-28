import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sharedDomainHandlers } from "../src/entry/lambda/adapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const handlerModulePath = path.join(root, "src/domains/presign/handlers/createPresignHandler.ts");
const adapterPath = path.join(root, "src/entry/lambda/adapter.ts");
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "../../.github/workflows/ci.yml");

const source = readFileSync(handlerModulePath, "utf8");
const adapterSource = readFileSync(adapterPath, "utf8");
const packageJson = readFileSync(packageJsonPath, "utf8");
const ciSource = readFileSync(ciPath, "utf8");

const { createPresignHandler } = await import(handlerModulePath);

const response = await createPresignHandler({
  path: { wardrobeId: "wd_001" },
  body: {
    contentType: "image/jpeg",
    category: "clothing",
    extension: "jpg",
  },
  headers: { "content-type": "application/json; charset=utf-8" },
  requestId: "req_presign_ok",
  dependencies: {
    wardrobeRepo: {
      async create() {
        return { ok: true };
      },
      async get() {
        return {
          Item: {
            PK: "W#wd_001",
            SK: "META",
            wardrobeId: "wd_001",
            name: "My Closet",
            createdAt: 1735689600000,
          },
        };
      },
    },
    presign: {
      buildImageKey() {
        return "clothing/wd_001/01JABCDEF123.jpg";
      },
      s3Client: {
        async presignPutObject(input) {
          return {
            bucket: "wardrobe-dev-images",
            key: input.key,
            method: "PUT",
            uploadUrl: "https://localhost:4566/wardrobe-dev-images/clothing/wd_001/01JABCDEF123.jpg?X-Amz-Signature=test",
            publicUrl: "http://localhost:4000/images/clothing/wd_001/01JABCDEF123.jpg",
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

let unsupportedMediaTypeCode = null;
try {
  await createPresignHandler({
    path: { wardrobeId: "wd_001" },
    body: {
      contentType: "image/jpeg",
      category: "clothing",
    },
    headers: { "content-type": "text/plain" },
    requestId: "req_presign_unsupported",
  });
} catch (error) {
  unsupportedMediaTypeCode = error?.code ?? null;
}

let validationCode = null;
try {
  await createPresignHandler({
    path: { wardrobeId: "wd_001" },
    body: {
      contentType: "application/json",
      category: "history",
    },
    headers: { "content-type": "application/json" },
    requestId: "req_presign_validation",
  });
} catch (error) {
  validationCode = error?.code ?? null;
}

let notFoundCode = null;
try {
  await createPresignHandler({
    path: { wardrobeId: "wd_missing" },
    body: {
      contentType: "image/jpeg",
      category: "clothing",
    },
    headers: { "content-type": "application/json" },
    requestId: "req_presign_not_found",
    dependencies: {
      wardrobeRepo: {
        async create() {
          return { ok: true };
        },
        async get() {
          return {};
        },
      },
    },
  });
} catch (error) {
  notFoundCode = error?.code ?? null;
}

let routedValidationCode = null;
try {
  await sharedDomainHandlers.presign({
    requestId: "req_route",
    method: "POST",
    pathname: "/wardrobes/wd_001/images/presign",
    path: { wardrobeId: "wd_001" },
    query: {},
    body: {
      contentType: "image/png",
      category: "invalid",
    },
    headers: { "content-type": "application/json" },
  });
} catch (error) {
  routedValidationCode = error?.code ?? null;
}

const responseBody = JSON.parse(response.body);

const checks = [
  {
    name: "API-17 handler が wardrobe存在確認後に imageKey/uploadUrl/method/expiresAt を返す",
    ok:
      response.statusCode === 200
      && responseBody.imageKey === "clothing/wd_001/01JABCDEF123.jpg"
      && responseBody.uploadUrl.includes("X-Amz-Signature=")
      && responseBody.method === "PUT"
      && responseBody.expiresAt === "2026-03-28T00:10:00.000Z",
    detail: { response, responseBody },
  },
  {
    name: "API-17 handler が Content-Type 不正を UNSUPPORTED_MEDIA_TYPE で拒否する",
    ok: unsupportedMediaTypeCode === "UNSUPPORTED_MEDIA_TYPE",
    detail: unsupportedMediaTypeCode,
  },
  {
    name: "API-17 handler が request 不正を VALIDATION_ERROR で返せる",
    ok: validationCode === "VALIDATION_ERROR",
    detail: validationCode,
  },
  {
    name: "API-17 handler が wardrobe未存在を NOT_FOUND で返せる",
    ok: notFoundCode === "NOT_FOUND",
    detail: notFoundCode,
  },
  {
    name: "lambda adapter が POST /wardrobes/{wardrobeId}/images/presign を handler へルーティングする",
    ok:
      adapterSource.includes('if (request.method === "POST" && request.pathname === `/wardrobes/${request.path.wardrobeId}/images/presign`)')
      && routedValidationCode === "VALIDATION_ERROR",
    detail: routedValidationCode,
  },
  {
    name: "source と package script / CI に BE-MS6-T04 テスト導線がある",
    ok:
      source.includes("export async function createPresignHandler")
      && packageJson.includes('"test:presign-ms6-api17": "node --import tsx/esm scripts/check-presign-ms6-api17-spec.mjs"')
      && packageJson.includes("pnpm run test:presign-ms6-api17")
      && ciSource.includes("pnpm --filter api test:presign-ms6-api17"),
    detail: { packageJson, ciSource },
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error("BE-MS6-T04 presign handler spec failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    if (failure.detail) {
      console.error(failure.detail);
    }
  }
  process.exit(1);
}

console.log("BE-MS6-T04 presign handler spec passed");
for (const check of checks) {
  console.log(`- ${check.name}`);
}
