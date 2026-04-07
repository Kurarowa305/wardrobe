import assert from "node:assert/strict";

import { createAppError } from "../src/core/errors/index.ts";
import { createErrorResponse, createSuccessResponse } from "../src/core/response/index.ts";
import { createLambdaHandler } from "../src/entry/lambda/adapter.ts";

function createLogSink() {
  const entries = [];
  return {
    entries,
    logger: {
      info(entry) {
        entries.push({ level: "info", entry });
      },
      error(entry) {
        entries.push({ level: "error", entry });
      },
    },
  };
}

{
  const { entries, logger } = createLogSink();
  const handler = createLambdaHandler({
    domain: "history",
    logger,
    handler() {
      return createSuccessResponse({ historyId: "hs_01" }, 201);
    },
  });

  const response = await handler({
    rawPath: "/wardrobes/wd_001/histories",
    pathParameters: { wardrobeId: "wd_001" },
    requestContext: { http: { method: "POST", path: "/wardrobes/wd_001/histories" }, requestId: "ctx_success" },
    headers: { "content-type": "application/json", "x-request-id": "req_success" },
    body: JSON.stringify({ date: "20260324", clothingIds: ["cl_001"] }),
  });

  assert.equal(response.statusCode, 201);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.level, "info");
  assert.equal(entries[0]?.entry.requestId, "req_success");
  assert.equal(entries[0]?.entry.method, "POST");
  assert.equal(entries[0]?.entry.path, "/wardrobes/wd_001/histories");
  assert.equal(entries[0]?.entry.domain, "history");
  assert.equal(entries[0]?.entry.wardrobeId, "wd_001");
  assert.equal(entries[0]?.entry.statusCode, 201);
  assert.equal(typeof entries[0]?.entry.durationMs, "number");
  assert.equal(entries[0]?.entry.durationMs >= 0, true);
  assert.equal(entries[0]?.entry.errorCode, undefined);
  console.log("- lambda success path emits info log with required request metadata");
}

{
  const { entries, logger } = createLogSink();
  const handler = createLambdaHandler({
    domain: "template",
    logger,
    handler(request) {
      return createErrorResponse(
        createAppError("NOT_FOUND", {
          requestId: request.requestId,
          details: {
            resource: "template",
            wardrobeId: request.path.wardrobeId,
            templateId: request.path.templateId,
          },
        }),
        { requestId: request.requestId },
      );
    },
  });

  const response = await handler({
    rawPath: "/wardrobes/wd_010/templates/tp_001",
    pathParameters: { wardrobeId: "wd_010", templateId: "tp_001" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_010/templates/tp_001" }, requestId: "ctx_handler_error" },
    headers: { "x-request-id": "req_handler_error" },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.level, "error");
  assert.equal(entries[0]?.entry.requestId, "req_handler_error");
  assert.equal(entries[0]?.entry.domain, "template");
  assert.equal(entries[0]?.entry.statusCode, 404);
  assert.equal(entries[0]?.entry.errorCode, "NOT_FOUND");
  console.log("- lambda handler error response is logged with error level and errorCode");
}

{
  const { entries, logger } = createLogSink();
  const handler = createLambdaHandler({
    domain: "clothing",
    logger,
    async handler() {
      throw new Error("unexpected");
    },
  });

  const response = await handler({
    rawPath: "/wardrobes/wd_020/clothing",
    pathParameters: { wardrobeId: "wd_020" },
    requestContext: { http: { method: "GET", path: "/wardrobes/wd_020/clothing" }, requestId: "ctx_throw" },
    headers: { "x-request-id": "req_throw" },
  });

  assert.equal(response.statusCode, 500);
  const json = JSON.parse(response.body);
  assert.equal(json.error.code, "INTERNAL_ERROR");
  assert.equal(json.error.requestId, "req_throw");

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.level, "error");
  assert.equal(entries[0]?.entry.requestId, "req_throw");
  assert.equal(entries[0]?.entry.domain, "clothing");
  assert.equal(entries[0]?.entry.statusCode, 500);
  assert.equal(entries[0]?.entry.errorCode, "INTERNAL_ERROR");
  console.log("- lambda adapter exception path is normalized and logged as INTERNAL_ERROR");
}

{
  const { entries, logger } = createLogSink();
  let called = false;
  const handler = createLambdaHandler({
    domain: "presign",
    logger,
    handler() {
      called = true;
      return createSuccessResponse({ ok: true });
    },
  });

  const response = await handler({
    rawPath: "/wardrobes/wd_030/images/presign",
    pathParameters: { wardrobeId: "wd_030" },
    requestContext: {
      http: { method: "POST", path: "/wardrobes/wd_030/images/presign" },
      requestId: "ctx_invalid_json",
    },
    headers: { "content-type": "application/json", "x-request-id": "req_invalid_json" },
    body: "{",
  });

  assert.equal(called, false);
  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "VALIDATION_ERROR");

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.level, "error");
  assert.equal(entries[0]?.entry.requestId, "req_invalid_json");
  assert.equal(entries[0]?.entry.domain, "presign");
  assert.equal(entries[0]?.entry.statusCode, 400);
  assert.equal(entries[0]?.entry.errorCode, "VALIDATION_ERROR");
  console.log("- invalid JSON request body is rejected before handler and logged with VALIDATION_ERROR");
}

console.log("Lambda logging spec passed");
