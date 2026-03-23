import assert from "node:assert/strict";

import { createServer } from "node:http";

process.env.AWS_REGION ??= "ap-northeast-1";
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.TABLE_NAME ??= "wardrobe-local";
process.env.S3_BUCKET ??= "wardrobe-local-bucket";
process.env.IMAGE_PUBLIC_BASE_URL ??= "http://127.0.0.1:4566/public";

const { createLocalRouter, resolveLocalRoute } = await import("../src/entry/local/router.ts");
const { createLocalServer } = await import("../src/entry/local/server.ts");
const { createSuccessResponse } = await import("../src/core/response/index.ts");

const clothingList = resolveLocalRoute("GET", "/wardrobes/wd_001/clothing");
assert.deepEqual(clothingList, {
  method: "GET",
  pattern: "/wardrobes/:wardrobeId/clothing",
  domain: "clothing",
  params: { wardrobeId: "wd_001" },
});
console.log("- clothing一覧パスを wardrobeId 付きで clothing ドメインへ解決できる");

const historyDelete = resolveLocalRoute("DELETE", "/wardrobes/wd_001/histories/hs_001");
assert.deepEqual(historyDelete, {
  method: "DELETE",
  pattern: "/wardrobes/:wardrobeId/histories/:historyId",
  domain: "history",
  params: { wardrobeId: "wd_001", historyId: "hs_001" },
});
console.log("- 履歴削除パスを historyId 付きで history ドメインへ解決できる");

assert.equal(resolveLocalRoute("GET", "/unknown"), null);
assert.equal(resolveLocalRoute("PUT", "/wardrobes"), null);
console.log("- 未定義パスと未対応メソッドはマッチしない");

const router = createLocalRouter({
  presign(request) {
    return createSuccessResponse({
      ok: true,
      requestId: request.requestId,
      query: request.query,
      body: request.body,
      wardrobeId: request.path.wardrobeId,
    }, 201);
  },
});

const requestServer = createServer(async (req, res) => {
  const outcome = await router.dispatch(req);
  res.writeHead(outcome.response.statusCode, outcome.response.headers);
  res.end(outcome.response.body);
});

await new Promise((resolve) => requestServer.listen(0, "127.0.0.1", resolve));
const requestAddress = requestServer.address();
if (!requestAddress || typeof requestAddress === "string") {
  throw new Error("failed to acquire test server address");
}

const presignResponse = await fetch(`http://127.0.0.1:${requestAddress.port}/wardrobes/wd_002/images/presign?category=clothing&tag=a&tag=b`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-request-id": "req_local_router",
  },
  body: JSON.stringify({ contentType: "image/png" }),
});
const presignJson = await presignResponse.json();
assert.equal(presignResponse.status, 201);
assert.deepEqual(presignJson, {
  ok: true,
  requestId: "req_local_router",
  query: {
    category: "clothing",
    tag: ["a", "b"],
  },
  body: { contentType: "image/png" },
  wardrobeId: "wd_002",
});
requestServer.close();
console.log("- local router は JSON body / query / requestId を handler に引き渡せる");

const localServer = createLocalServer({
  logger: {
    info() {},
    error() {},
  },
  handlers: {
    wardrobe(request) {
      return createSuccessResponse({ ok: true, wardrobeId: request.path.wardrobeId ?? null }, 200);
    },
  },
});
await new Promise((resolve) => localServer.listen(0, "127.0.0.1", resolve));
const localAddress = localServer.address();
if (!localAddress || typeof localAddress === "string") {
  throw new Error("failed to acquire local server address");
}

const foundResponse = await fetch(`http://127.0.0.1:${localAddress.port}/wardrobes/wd_003`);
assert.equal(foundResponse.status, 200);
assert.deepEqual(await foundResponse.json(), { ok: true, wardrobeId: "wd_003" });
console.log("- createLocalServer は解決済みルートを HTTP サーバーから handler へ中継できる");

const notFoundResponse = await fetch(`http://127.0.0.1:${localAddress.port}/unsupported/path`);
assert.equal(notFoundResponse.status, 404);
const notFoundJson = await notFoundResponse.json();
assert.equal(notFoundJson.error.code, "NOT_FOUND");
localServer.close();
console.log("- 未定義パスは共通エラーレスポンスで 404 を返す");

console.log("BE-MS0-T11 local router spec passed");
