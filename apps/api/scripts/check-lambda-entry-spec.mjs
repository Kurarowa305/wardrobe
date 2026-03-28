import assert from "node:assert/strict";

import { createPresignHandler } from "../src/domains/presign/handlers/createPresignHandler.ts";
import { createLambdaHandler } from "../src/entry/lambda/adapter.ts";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";
process.env.S3_BUCKET ??= "wardrobe-local-bucket";
process.env.IMAGE_PUBLIC_BASE_URL ??= "http://127.0.0.1:4566/public";

const { handler: wardrobeHandler, wardrobeLambdaEntry } = await import("../src/entry/lambda/wardrobe_server.ts");
const { handler: clothingHandler, clothingLambdaEntry } = await import("../src/entry/lambda/clothing_server.ts");
const { handler: templateHandler, templateLambdaEntry } = await import("../src/entry/lambda/template_server.ts");
const { handler: historyHandler, historyLambdaEntry } = await import("../src/entry/lambda/history_server.ts");
const { handler: presignHandler, presignLambdaEntry } = await import("../src/entry/lambda/presign_server.ts");

assert.equal(wardrobeLambdaEntry, "wardrobe");
assert.equal(clothingLambdaEntry, "clothing");
assert.equal(templateLambdaEntry, "template");
assert.equal(historyLambdaEntry, "history");
assert.equal(presignLambdaEntry, "presign");
console.log("- 各 Lambda entry は期待するドメイン識別子を公開している");

const wardrobeResponse = await wardrobeHandler({
  rawPath: "/wardrobes/wd_001",
  pathParameters: { wardrobeId: "wd_001" },
  requestContext: { http: { method: "GET", path: "/wardrobes/wd_001" }, requestId: "ctx_wardrobe" },
  headers: { "x-request-id": "req_wardrobe" },
});
assert.equal(wardrobeResponse.statusCode, 404);
assert.deepEqual(JSON.parse(wardrobeResponse.body), {
  error: {
    code: "NOT_FOUND",
    message: "Wardrobe was not found.",
    details: {
      resource: "wardrobe",
      wardrobeId: "wd_001",
    },
    requestId: "req_wardrobe",
  },
});
console.log("- wardrobe Lambda entry は GET /wardrobes/{wardrobeId} を wardrobe handler へ委譲し、NOT_FOUND を共通形式で返せる");

const clothingResponse = await clothingHandler({
  rawPath: "/wardrobes/wd_010/clothing/cl_001",
  pathParameters: { wardrobeId: "wd_010", clothingId: "cl_001" },
  requestContext: { http: { method: "PATCH", path: "/wardrobes/wd_010/clothing/cl_001" }, requestId: "ctx_clothing" },
  headers: { "content-type": "application/json", "x-request-id": "req_clothing_patch" },
  body: JSON.stringify({ name: "更新名" }),
});
assert.equal(clothingResponse.statusCode, 404);
assert.deepEqual(JSON.parse(clothingResponse.body), {
  error: {
    code: "NOT_FOUND",
    message: "Clothing was not found.",
    details: {
      resource: "clothing",
      wardrobeId: "wd_010",
      clothingId: "cl_001",
    },
    requestId: "req_clothing_patch",
  },
});
console.log("- clothing Lambda entry は PATCH /clothing/{clothingId} を API-06 handler に委譲し、共通エラー形式を返せる");

const templateResponse = await templateHandler({
  rawPath: "/wardrobes/wd_020/templates/tmp_001",
  pathParameters: { wardrobeId: "wd_020", templateId: "tmp_001" },
  requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_020/templates/tmp_001" }, requestId: "ctx_template" },
  headers: { "x-request-id": "req_template_delete" },
});
assert.equal(templateResponse.statusCode, 404);
assert.deepEqual(JSON.parse(templateResponse.body), {
  error: {
    code: "NOT_FOUND",
    message: "Template was not found.",
    details: {
      resource: "template",
      wardrobeId: "wd_020",
      templateId: "tmp_001",
    },
    requestId: "req_template_delete",
  },
});
console.log("- template Lambda entry は DELETE /templates/{templateId} を API-12 handler へ委譲し、共通エラー形式を返せる");

const createdHistoryResponse = await historyHandler({
  rawPath: "/wardrobes/wd_030/histories",
  pathParameters: { wardrobeId: "wd_030" },
  requestContext: { http: { method: "POST", path: "/wardrobes/wd_030/histories" }, requestId: "ctx_history_create" },
  headers: { "content-type": "application/json", "x-request-id": "req_history_create" },
  body: JSON.stringify({ date: "20260323", clothingIds: ["cl_001", "cl_002"] }),
});
assert.equal(createdHistoryResponse.statusCode, 201);
const createdHistoryJson = JSON.parse(createdHistoryResponse.body);
assert.equal(typeof createdHistoryJson.historyId, "string");
assert.match(createdHistoryJson.historyId, /^hs_[A-Za-z0-9_-]+$/);
assert.deepEqual(Object.keys(createdHistoryJson).sort(), ["historyId"]);
console.log("- history Lambda entry は createHistoryHandler と同じバリデーションを行い、201 + hs_ 形式の historyId を返せる");

const deletedHistoryResponse = await historyHandler({
  rawPath: "/wardrobes/wd_030/histories/hs_001",
  pathParameters: { wardrobeId: "wd_030", historyId: "hs_001" },
  requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_030/histories/hs_001" }, requestId: "ctx_history_delete" },
  headers: { "x-request-id": "req_history_delete" },
});
assert.equal(deletedHistoryResponse.statusCode, 404);
assert.deepEqual(JSON.parse(deletedHistoryResponse.body), {
  error: {
    code: "NOT_FOUND",
    message: "History was not found.",
    details: {
      resource: "history",
      wardrobeId: "wd_030",
      historyId: "hs_001",
    },
    requestId: "req_history_delete",
  },
});
console.log("- history Lambda entry は deleteHistoryHandler で未存在時に共通エラー形式（NOT_FOUND）を返せる");

const invalidHistoryResponse = await historyHandler({
  rawPath: "/wardrobes/wd_030/histories",
  pathParameters: { wardrobeId: "wd_030" },
  requestContext: { http: { method: "POST", path: "/wardrobes/wd_030/histories" }, requestId: "ctx_history_invalid" },
  headers: { "content-type": "application/json", "x-request-id": "req_history_invalid" },
  body: JSON.stringify({ date: "2026-03-23" }),
});
assert.equal(invalidHistoryResponse.statusCode, 400);
const invalidHistoryJson = JSON.parse(invalidHistoryResponse.body);
assert.equal(invalidHistoryJson.error.code, "VALIDATION_ERROR");
assert.equal(invalidHistoryJson.error.requestId, "req_history_invalid");
console.log("- history Lambda entry は handler 例外を共通エラーレスポンスへ正規化できる");

const presignHandlerWithDeps = createLambdaHandler({
  domain: "presign",
  handler(request) {
    return createPresignHandler({
      path: request.path,
      body: request.body,
      headers: request.headers,
      requestId: request.requestId,
      dependencies: {
        wardrobeRepo: {
          async create() {
            return { ok: true };
          },
          async get() {
            return {
              Item: {
                PK: "W#wd_040",
                SK: "META",
                wardrobeId: "wd_040",
                name: "Lambda entry preset",
                createdAt: 1735689600000,
              },
            };
          },
        },
        presign: {
          buildImageKey() {
            return "clothing/wd_040/01JENTRYTEST.png";
          },
          s3Client: {
            async presignPutObject(input) {
              return {
                bucket: "wardrobe-local-bucket",
                key: input.key,
                method: "PUT",
                uploadUrl: "https://example.com/upload?X-Amz-Signature=test",
                publicUrl: "http://127.0.0.1:4566/public/clothing/wd_040/01JENTRYTEST.png",
                expiresAt: "2026-03-28T00:10:00.000Z",
                request: {
                  operation: "PutObject",
                  region: "ap-northeast-1",
                  bucket: "wardrobe-local-bucket",
                  storageDriver: "local",
                  input: {
                    Bucket: "wardrobe-local-bucket",
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
  },
});

const presignResponse = await presignHandlerWithDeps({
  rawPath: "/wardrobes/wd_040/images/presign",
  pathParameters: { wardrobeId: "wd_040" },
  requestContext: {
    http: { method: "POST", path: "/wardrobes/wd_040/images/presign" },
    requestId: "ctx_presign",
  },
  headers: { "content-type": "application/json", "x-request-id": "req_presign" },
  body: JSON.stringify({ contentType: "image/png", category: "clothing", extension: "png" }),
});
assert.equal(presignResponse.statusCode, 200);
const presignJson = JSON.parse(presignResponse.body);
assert.equal(presignJson.imageKey, "clothing/wd_040/01JENTRYTEST.png");
assert.equal(typeof presignJson.uploadUrl, "string");
assert.equal(presignJson.method, "PUT");
assert.equal(typeof presignJson.expiresAt, "string");
console.log("- presign Lambda entry 検証は API-17 handler 経由で 200 + imageKey/uploadUrl/method/expiresAt を確認できる");

const invalidPresignResponse = await presignHandlerWithDeps({
  rawPath: "/wardrobes/wd_040/images/presign",
  pathParameters: { wardrobeId: "wd_040" },
  requestContext: {
    http: { method: "POST", path: "/wardrobes/wd_040/images/presign" },
    requestId: "ctx_presign_invalid",
  },
  headers: { "content-type": "application/json", "x-request-id": "req_presign_invalid" },
  body: JSON.stringify({ contentType: "image/png", category: "invalid" }),
});
assert.equal(invalidPresignResponse.statusCode, 400);
const invalidPresignJson = JSON.parse(invalidPresignResponse.body);
assert.equal(invalidPresignJson.error.code, "VALIDATION_ERROR");
assert.equal(invalidPresignJson.error.requestId, "req_presign_invalid");
console.log("- presign Lambda entry 検証は category 不正を VALIDATION_ERROR(400) で確認できる");

const presignNotFoundResponse = await presignHandler({
  rawPath: "/wardrobes/wd_040/images/presign",
  pathParameters: { wardrobeId: "wd_040" },
  requestContext: {
    http: { method: "POST", path: "/wardrobes/wd_040/images/presign" },
    requestId: "ctx_presign_not_found",
  },
  headers: { "content-type": "application/json", "x-request-id": "req_presign_not_found" },
  body: JSON.stringify({ contentType: "image/png", category: "clothing" }),
});
assert.equal(presignNotFoundResponse.statusCode, 404);
assert.equal(JSON.parse(presignNotFoundResponse.body).error.code, "NOT_FOUND");
console.log("- 実際の presign Lambda entry も API-17 handler を経由し、wardrobe 未存在時は NOT_FOUND を返せる");

console.log("BE-MS0-T12 lambda entry spec passed");
