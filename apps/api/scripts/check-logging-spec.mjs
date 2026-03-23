import assert from "node:assert/strict";

import {
  createConsoleLogger,
  createErrorLogOutcome,
  createRequestLogEntry,
  logRequest,
  measureDurationMs,
  serializeLogEntry,
} from "../src/core/logging/index.ts";
import { createAppError } from "../src/core/errors/index.ts";

const timestamp = new Date("2026-03-20T12:34:56.000Z");

const successEntry = createRequestLogEntry(
  {
    requestId: "req_001",
    method: "POST",
    path: "/wardrobes/wd_001/histories",
    domain: "history",
    wardrobeId: "wd_001",
  },
  {
    statusCode: 201,
    durationMs: 42,
  },
  { timestamp },
);
assert.deepEqual(successEntry, {
  timestamp: "2026-03-20T12:34:56.000Z",
  level: "info",
  message: "request_completed",
  requestId: "req_001",
  method: "POST",
  path: "/wardrobes/wd_001/histories",
  domain: "history",
  wardrobeId: "wd_001",
  statusCode: 201,
  durationMs: 42,
});
console.log("- request log entry includes requestId/method/path/domain/wardrobeId/statusCode/durationMs");

const errorEntry = createRequestLogEntry(
  {
    requestId: "req_002",
    method: "GET",
    path: "/wardrobes/wd_002/templates",
    domain: "template",
    wardrobeId: "wd_002",
  },
  {
    statusCode: 400,
    durationMs: 12,
    errorCode: "VALIDATION_ERROR",
  },
  { timestamp, message: "request_failed" },
);
assert.equal(errorEntry.level, "error");
assert.equal(errorEntry.errorCode, "VALIDATION_ERROR");
assert.equal(errorEntry.message, "request_failed");
console.log("- error logs include errorCode and switch level to error");

assert.equal(
  serializeLogEntry(successEntry),
  JSON.stringify(successEntry),
);
console.log("- structured log entries are serialized as JSON");

assert.equal(measureDurationMs(100, 180), 80);
assert.equal(measureDurationMs(250, 200), 0);
console.log("- duration measurement is normalized to non-negative milliseconds");

const normalizedOutcome = createErrorLogOutcome(
  createAppError("INVALID_CURSOR", { requestId: "req_003" }),
  { requestId: "req_003" },
);
assert.deepEqual(normalizedOutcome, {
  statusCode: 400,
  durationMs: 0,
  errorCode: "INVALID_CURSOR",
});

const unknownOutcome = createErrorLogOutcome(new Error("boom"), {
  requestId: "req_004",
  statusCode: 503,
});
assert.deepEqual(unknownOutcome, {
  statusCode: 503,
  durationMs: 0,
  errorCode: "INTERNAL_ERROR",
});
console.log("- error outcomes normalize AppError and unknown exceptions into shared error codes");

const sink = [];
const logger = {
  info(entry) {
    sink.push({ level: "info", entry });
  },
  error(entry) {
    sink.push({ level: "error", entry });
  },
};

const loggedSuccess = logRequest(
  logger,
  { requestId: "req_005", method: "DELETE", path: "/wardrobes/wd_005/histories/hs_01", domain: "history", wardrobeId: "wd_005" },
  { statusCode: 204, durationMs: 9 },
  { timestamp },
);
const loggedError = logRequest(
  logger,
  { requestId: "req_006", method: "GET", path: "/wardrobes/wd_006/clothing", domain: "clothing", wardrobeId: "wd_006" },
  { statusCode: 500, durationMs: 31, errorCode: "INTERNAL_ERROR" },
  { timestamp },
);
assert.equal(sink.length, 2);
assert.deepEqual(sink[0], { level: "info", entry: loggedSuccess });
assert.deepEqual(sink[1], { level: "error", entry: loggedError });
console.log("- logRequest routes success/error logs to the appropriate logger method");

const originalInfo = console.info;
const originalError = console.error;
const consoleSink = [];
console.info = (message) => consoleSink.push({ level: "info", message });
console.error = (message) => consoleSink.push({ level: "error", message });
try {
  const consoleLogger = createConsoleLogger();
  consoleLogger.info(successEntry);
  consoleLogger.error(errorEntry);
} finally {
  console.info = originalInfo;
  console.error = originalError;
}
assert.deepEqual(consoleSink, [
  { level: "info", message: JSON.stringify(successEntry) },
  { level: "error", message: JSON.stringify(errorEntry) },
]);
console.log("- console logger emits JSON lines for both success and error cases");

console.log("BE-MS0-T10 logging spec passed");
