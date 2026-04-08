import assert from "node:assert/strict";

import { createLambdaHandler } from "../src/entry/lambda/adapter.ts";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";
process.env.S3_BUCKET ??= "wardrobe-local-bucket";
process.env.IMAGE_PUBLIC_BASE_URL ??= "http://127.0.0.1:4566/public";

function isDefaultDomainResponse(response, domain) {
  if (response.statusCode !== 200) {
    return false;
  }

  try {
    const json = JSON.parse(response.body);
    return Boolean(json?.ok === true && json?.domain === domain);
  } catch {
    return false;
  }
}

async function runCase(handler, domain, title, event, expectDefault) {
  const response = await handler(event);
  const actualDefault = isDefaultDomainResponse(response, domain);
  assert.equal(
    actualDefault,
    expectDefault,
    `${title}: expected default=${expectDefault}, actual default=${actualDefault}, status=${response.statusCode}`,
  );
  console.log(`- ${title}`);
}

const clothingHandler = createLambdaHandler({ domain: "clothing" });
const templateHandler = createLambdaHandler({ domain: "template" });
const historyHandler = createLambdaHandler({ domain: "history" });

await runCase(
  clothingHandler,
  "clothing",
  "clothing GET detail は clothingId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/clothing/cl_001",
    pathParameters: { wardrobeId: "wd_001", clothingId: "cl_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/clothing/cl_001" }, requestId: "ctx_c_get" },
    headers: { "x-request-id": "req_c_get" },
  },
  false,
);

await runCase(
  clothingHandler,
  "clothing",
  "clothing PATCH detail は clothingId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/clothing/cl_001",
    pathParameters: { wardrobeId: "wd_001", clothingId: "cl_001" },
    requestContext: { http: { method: "PATCH", path: "/wardrobes/wd_001/clothing/cl_001" }, requestId: "ctx_c_patch" },
    headers: { "content-type": "application/json", "x-request-id": "req_c_patch" },
    body: JSON.stringify({ name: "更新名" }),
  },
  false,
);

await runCase(
  clothingHandler,
  "clothing",
  "clothing DELETE detail は clothingId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/clothing/cl_001",
    pathParameters: { wardrobeId: "wd_001", clothingId: "cl_001" },
    requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_001/clothing/cl_001" }, requestId: "ctx_c_delete" },
    headers: { "x-request-id": "req_c_delete" },
  },
  false,
);

await runCase(
  clothingHandler,
  "clothing",
  "clothing GET detail 相当でも clothingId が欠落すると default 応答へフォールバックする",
  {
    rawPath: "/wardrobes/wd_001/clothing/cl_001",
    pathParameters: { wardrobeId: "wd_001", proxy: "cl_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/clothing/cl_001" }, requestId: "ctx_c_proxy" },
    headers: { "x-request-id": "req_c_proxy" },
  },
  true,
);

await runCase(
  templateHandler,
  "template",
  "template GET detail は templateId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/templates/tp_001",
    pathParameters: { wardrobeId: "wd_001", templateId: "tp_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/templates/tp_001" }, requestId: "ctx_t_get" },
    headers: { "x-request-id": "req_t_get" },
  },
  false,
);

await runCase(
  templateHandler,
  "template",
  "template PATCH detail は templateId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/templates/tp_001",
    pathParameters: { wardrobeId: "wd_001", templateId: "tp_001" },
    requestContext: { http: { method: "PATCH", path: "/wardrobes/wd_001/templates/tp_001" }, requestId: "ctx_t_patch" },
    headers: { "content-type": "application/json", "x-request-id": "req_t_patch" },
    body: JSON.stringify({ name: "更新テンプレ", clothingIds: ["cl_001"] }),
  },
  false,
);

await runCase(
  templateHandler,
  "template",
  "template DELETE detail は templateId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/templates/tp_001",
    pathParameters: { wardrobeId: "wd_001", templateId: "tp_001" },
    requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_001/templates/tp_001" }, requestId: "ctx_t_delete" },
    headers: { "x-request-id": "req_t_delete" },
  },
  false,
);

await runCase(
  historyHandler,
  "history",
  "history GET detail は historyId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/histories/hs_001",
    pathParameters: { wardrobeId: "wd_001", historyId: "hs_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/histories/hs_001" }, requestId: "ctx_h_get" },
    headers: { "x-request-id": "req_h_get" },
  },
  false,
);

await runCase(
  historyHandler,
  "history",
  "history DELETE detail は historyId があると detail 分岐へ到達し default 応答にならない",
  {
    rawPath: "/wardrobes/wd_001/histories/hs_001",
    pathParameters: { wardrobeId: "wd_001", historyId: "hs_001" },
    requestContext: { http: { method: "DELETE", path: "/wardrobes/wd_001/histories/hs_001" }, requestId: "ctx_h_delete" },
    headers: { "x-request-id": "req_h_delete" },
  },
  false,
);

await runCase(
  historyHandler,
  "history",
  "history GET detail 相当でも historyId が欠落すると default 応答へフォールバックする",
  {
    rawPath: "/wardrobes/wd_001/histories/hs_001",
    pathParameters: { wardrobeId: "wd_001", proxy: "hs_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_001/histories/hs_001" }, requestId: "ctx_h_proxy" },
    headers: { "x-request-id": "req_h_proxy" },
  },
  true,
);

console.log("Lambda detail routing spec passed");
