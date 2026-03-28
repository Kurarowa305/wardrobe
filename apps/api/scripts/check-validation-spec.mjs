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

const createResponse = await createHistoryHandler({
  path: { wardrobeId: "wd_01" },
  body: { date: "20260101", clothingIds: ["cl_01", "cl_02"] },
  headers: { "content-type": "application/json" },
  dependencies: {
    async transactWriteItems() {
      return { ok: true };
    },
    generateHistoryId: () => "hs_validation",
  },
});
assert.equal(createResponse.statusCode, 201);
assert.deepEqual(createResponse.json, {
  historyId: "hs_validation",
});
console.log("- handler can consume shared validation utility and return success response");

await assert.rejects(
  createHistoryHandler({
    path: { wardrobeId: "wd_01" },
    body: { date: "2026-01-01", templateId: "tp_01" },
    headers: { "content-type": "application/json" },
    requestId: "req_history_validation",
  }),
  (error) => {
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.equal(error.requestId, "req_history_validation");
    return true;
  },
);
console.log("- handler validation failures surface as VALIDATION_ERROR");

await assert.rejects(
  createHistoryHandler({
    path: { wardrobeId: "wd_01" },
    body: { date: "20260101", templateId: "tp_01" },
    headers: { "content-type": "text/plain" },
    requestId: "req_history_content_type",
  }),
  (error) => {
    assert.equal(error.code, "UNSUPPORTED_MEDIA_TYPE");
    return true;
  },
);
console.log("- handler rejects non-json content type as UNSUPPORTED_MEDIA_TYPE");

const deleteResponse = await deleteHistoryHandler({
  path: { wardrobeId: "wd_01", historyId: "hs_01" },
  dependencies: {
    async getHistory() {
      return {
        Item: {
          wardrobeId: "wd_01",
          historyId: "hs_01",
          date: "20260101",
          templateId: null,
          clothingIds: ["cl_01"],
          createdAt: 1735689600000,
        },
      };
    },
    async batchGetClothingByIds() {
      return [
        {
          Responses: {
            WardrobeTable: [
              {
                clothingId: "cl_01",
                wearCount: 1,
                lastWornAt: Date.UTC(2026, 0, 1, 0, 0, 0, 0),
              },
            ],
          },
        },
      ];
    },
    async getWearDailyCount() {
      return 1;
    },
    async findLatestBeforeDate() {
      return null;
    },
    async transactWriteItems() {
      return { ok: true };
    },
  },
});
assert.equal(deleteResponse.statusCode, 204);
assert.equal(deleteResponse.body, "");
console.log("- delete handler reuses shared path validation before no-content response");
