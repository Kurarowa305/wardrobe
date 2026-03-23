import assert from "node:assert/strict";

import { ZodError, z } from "zod";

import {
  normalizeValidationError,
  parseRequest,
  safeValidate,
  validateOrThrow,
} from "../src/core/validation/index.ts";
import { createHistoryHandler } from "../src/domains/history/handlers/createHistoryHandler.ts";
import { deleteHistoryHandler } from "../src/domains/history/handlers/deleteHistoryHandler.ts";

const basicSchema = z.object({
  limit: z.number().int().min(1).max(50),
});

const success = safeValidate(basicSchema, { limit: 20 });
assert.deepEqual(success, {
  success: true,
  data: { limit: 20 },
});
console.log("- safeValidate returns parsed data for valid input");

const failed = safeValidate(basicSchema, { limit: 0 });
assert.equal(failed.success, false);
assert.deepEqual(failed.issues, ["limit: Too small: expected number to be >=1"]);
console.log("- safeValidate returns formatted issues for invalid input");

const validationError = normalizeValidationError(
  "body",
  new ZodError([
    {
      code: "too_small",
      minimum: 1,
      inclusive: true,
      origin: "array",
      path: ["clothingIds"],
      message: "Too small: expected array to have >=1 items",
    },
  ]),
  "req_validation",
);
assert.equal(validationError.code, "VALIDATION_ERROR");
assert.equal(validationError.status, 400);
assert.deepEqual(validationError.details, {
  "body.clothingIds": "Too small: expected array to have >=1 items",
});
assert.equal(validationError.requestId, "req_validation");
console.log("- Zod validation failures are normalized to VALIDATION_ERROR");

assert.throws(
  () => validateOrThrow("query", basicSchema, { limit: 100 }, "req_query"),
  (error) => {
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.deepEqual(error.details, {
      "query.limit": "Too big: expected number to be <=50",
    });
    assert.equal(error.requestId, "req_query");
    return true;
  },
);
console.log("- validateOrThrow throws AppError with scope-qualified details");

const parsed = parseRequest(
  {
    path: z.object({ wardrobeId: z.string().min(1) }).strict(),
    query: z.object({ limit: z.coerce.number().int().min(1).max(50) }).strict(),
    body: z.object({ name: z.string().min(1) }).strict(),
  },
  {
    path: { wardrobeId: "wd_01" },
    query: { limit: "10" },
    body: { name: "daily wear" },
  },
);
assert.deepEqual(parsed, {
  path: { wardrobeId: "wd_01" },
  query: { limit: 10 },
  body: { name: "daily wear" },
});
console.log("- parseRequest validates path/query/body with individual schemas");

const createResponse = createHistoryHandler({
  path: { wardrobeId: "wd_01" },
  body: { date: "20260101", clothingIds: ["cl_01", "cl_02"] },
});
assert.equal(createResponse.statusCode, 201);
assert.deepEqual(createResponse.json, {
  ok: true,
  wardrobeId: "wd_01",
  date: "20260101",
  inputType: "clothing",
});
console.log("- handler can validate request payloads through shared schema utility");

assert.throws(
  () =>
    createHistoryHandler({
      path: { wardrobeId: "wd_01" },
      body: { date: "2026-01-01", templateId: "tp_01", clothingIds: ["cl_01"] },
      requestId: "req_history",
    }),
  (error) => {
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.deepEqual(error.details, {
      "body.date": "Expected yyyymmdd format.",
      "body.templateId": "templateId and clothingIds cannot be used together.",
    });
    assert.equal(error.requestId, "req_history");
    return true;
  },
);
console.log("- handler validation failures surface as VALIDATION_ERROR");

const deleteResponse = deleteHistoryHandler({
  path: { wardrobeId: "wd_01", historyId: "hs_01" },
});
assert.equal(deleteResponse.statusCode, 204);
assert.equal(deleteResponse.body, "");
console.log("- delete handler reuses shared path validation before no-content response");
