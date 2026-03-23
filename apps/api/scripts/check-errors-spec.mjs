import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const moduleUrl = pathToFileURL(path.join(root, "src/core/errors/index.ts")).href;
const errors = await import(moduleUrl);

const {
  AppError,
  createAppError,
  errorCodes,
  errorStatusByCode,
  getDefaultErrorMessage,
  getErrorStatus,
  isAppError,
  isErrorCode,
  normalizeUnknownError,
} = errors;

assert.deepEqual(errorCodes, [
  "VALIDATION_ERROR",
  "INVALID_CURSOR",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
]);

assert.equal(errorStatusByCode.VALIDATION_ERROR, 400);
assert.equal(errorStatusByCode.INVALID_CURSOR, 400);
assert.equal(errorStatusByCode.NOT_FOUND, 404);
assert.equal(errorStatusByCode.CONFLICT, 409);
assert.equal(errorStatusByCode.PAYLOAD_TOO_LARGE, 413);
assert.equal(errorStatusByCode.UNSUPPORTED_MEDIA_TYPE, 415);
assert.equal(errorStatusByCode.RATE_LIMITED, 429);
assert.equal(errorStatusByCode.INTERNAL_ERROR, 500);
assert.equal(errorStatusByCode.SERVICE_UNAVAILABLE, 503);

assert.equal(getErrorStatus("CONFLICT"), 409);
assert.equal(getDefaultErrorMessage("INVALID_CURSOR"), "Cursor is invalid.");
assert.equal(isErrorCode("NOT_FOUND"), true);
assert.equal(isErrorCode("UNKNOWN_ERROR"), false);

const validationError = createAppError("VALIDATION_ERROR", {
  details: { limit: "must be between 1 and 50" },
  requestId: "req_validation",
});
assert.ok(validationError instanceof AppError);
assert.equal(validationError.name, "AppError");
assert.equal(validationError.code, "VALIDATION_ERROR");
assert.equal(validationError.status, 400);
assert.equal(validationError.message, "Invalid request parameters.");
assert.deepEqual(validationError.details, { limit: "must be between 1 and 50" });
assert.equal(validationError.requestId, "req_validation");
assert.equal(isAppError(validationError), true);

const passthrough = normalizeUnknownError(validationError);
assert.equal(passthrough, validationError);

const clonedWithRequestId = normalizeUnknownError(
  createAppError("NOT_FOUND", { message: "wardrobe not found" }),
  "req_not_found",
);
assert.notEqual(clonedWithRequestId, validationError);
assert.equal(clonedWithRequestId.code, "NOT_FOUND");
assert.equal(clonedWithRequestId.status, 404);
assert.equal(clonedWithRequestId.message, "wardrobe not found");
assert.equal(clonedWithRequestId.requestId, "req_not_found");

const nativeError = new Error("dynamodb timeout");
const normalizedNativeError = normalizeUnknownError(nativeError, "req_internal");
assert.equal(normalizedNativeError.code, "INTERNAL_ERROR");
assert.equal(normalizedNativeError.status, 500);
assert.equal(normalizedNativeError.message, "dynamodb timeout");
assert.equal(normalizedNativeError.requestId, "req_internal");
assert.equal(normalizedNativeError.cause, nativeError);

const normalizedUnknownValue = normalizeUnknownError({ retryAfterSec: 5 }, "req_unknown");
assert.equal(normalizedUnknownValue.code, "INTERNAL_ERROR");
assert.equal(normalizedUnknownValue.status, 500);
assert.equal(normalizedUnknownValue.message, "Internal server error.");
assert.equal(normalizedUnknownValue.requestId, "req_unknown");
assert.deepEqual(normalizedUnknownValue.details, { value: { retryAfterSec: 5 } });

console.log("BE-MS0-T06 errors spec passed");
console.log("- error code union exposes API design codes");
console.log("- error code to HTTP status mapping matches API design");
console.log("- AppError captures code/status/message/details/requestId");
console.log("- normalizeUnknownError handles AppError / Error / unknown values");
