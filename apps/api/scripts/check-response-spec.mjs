import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const moduleUrl = pathToFileURL(path.join(root, "src/core/response/index.ts")).href;
const errorsModuleUrl = pathToFileURL(path.join(root, "src/core/errors/index.ts")).href;
const response = await import(moduleUrl);
const errors = await import(errorsModuleUrl);

const {
  JSON_CONTENT_TYPE,
  createErrorResponse,
  createJsonHeaders,
  createJsonResponse,
  createNoContentResponse,
  createSuccessResponse,
  toErrorBody,
} = response;
const { createAppError } = errors;

assert.equal(JSON_CONTENT_TYPE, "application/json; charset=utf-8");
assert.deepEqual(createJsonHeaders(), {
  "content-type": "application/json; charset=utf-8",
});
assert.deepEqual(createJsonHeaders({ "x-request-id": "req_123" }), {
  "content-type": "application/json; charset=utf-8",
  "x-request-id": "req_123",
});

const createdResponse = createJsonResponse(201, { wardrobeId: "wd_123" }, { headers: { etag: '"v1"' } });
assert.equal(createdResponse.statusCode, 201);
assert.deepEqual(createdResponse.headers, {
  "content-type": "application/json; charset=utf-8",
  etag: '"v1"',
});
assert.equal(createdResponse.body, JSON.stringify({ wardrobeId: "wd_123" }));
assert.deepEqual(createdResponse.json, { wardrobeId: "wd_123" });

const successResponse = createSuccessResponse({ items: [] });
assert.equal(successResponse.statusCode, 200);
assert.equal(successResponse.body, JSON.stringify({ items: [] }));
assert.deepEqual(successResponse.json, { items: [] });

const noContentResponse = createNoContentResponse();
assert.equal(noContentResponse.statusCode, 204);
assert.deepEqual(noContentResponse.headers, {});
assert.equal(noContentResponse.body, "");

const validationError = createAppError("VALIDATION_ERROR", {
  details: { limit: "must be between 1 and 50" },
  requestId: "req_validation",
});
assert.deepEqual(toErrorBody(validationError), {
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request parameters.",
    details: { limit: "must be between 1 and 50" },
    requestId: "req_validation",
  },
});

const appErrorResponse = createErrorResponse(validationError, {
  headers: { "cache-control": "no-store" },
});
assert.equal(appErrorResponse.statusCode, 400);
assert.deepEqual(appErrorResponse.headers, {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
});
assert.deepEqual(JSON.parse(appErrorResponse.body), {
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request parameters.",
    details: { limit: "must be between 1 and 50" },
    requestId: "req_validation",
  },
});

const normalizedResponse = createErrorResponse(new Error("dynamodb timeout"), {
  requestId: "req_internal",
});
assert.equal(normalizedResponse.statusCode, 500);
assert.deepEqual(JSON.parse(normalizedResponse.body), {
  error: {
    code: "INTERNAL_ERROR",
    message: "dynamodb timeout",
    requestId: "req_internal",
  },
});

console.log("BE-MS0-T07 response spec passed");
console.log("- JSON success responses are generated with common headers/body serialization");
console.log("- no-content responses can be generated without a body");
console.log("- error responses use the shared envelope from AppError / unknown errors");
