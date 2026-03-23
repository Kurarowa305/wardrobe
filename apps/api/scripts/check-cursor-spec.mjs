import assert from "node:assert/strict";

import { createAppError, isAppError } from "../src/core/errors/index.ts";
import { decodeCursor, encodeCursor, inspectCursor } from "../src/core/cursor/index.ts";

const encoded = encodeCursor({
  resource: "clothing",
  order: "asc",
  filters: { genre: "tops", status: ["ACTIVE"], limit: 50, optional: undefined },
  position: { sk: "CREATED#1735600000000", clothingId: "cl_01HZZAAA" },
});

const envelope = inspectCursor(encoded);
assert.deepEqual(envelope, {
  v: 1,
  resource: "clothing",
  order: "asc",
  filters: { genre: "tops", limit: 50, status: ["ACTIVE"] },
  position: { sk: "CREATED#1735600000000", clothingId: "cl_01HZZAAA" },
});
console.log("- encodeCursor stores version/resource/order/filters/position in a normalized envelope");

const decoded = decodeCursor({
  cursor: encoded,
  resource: "clothing",
  order: "asc",
  filters: { status: ["ACTIVE"], limit: 50, genre: "tops" },
});
assert.deepEqual(decoded, {
  sk: "CREATED#1735600000000",
  clothingId: "cl_01HZZAAA",
});
console.log("- decodeCursor restores the paging position when order and filters match");

assert.equal(
  decodeCursor({
    cursor: null,
    resource: "clothing",
    order: "asc",
    filters: { genre: "tops" },
  }),
  null,
);
console.log("- decodeCursor accepts missing cursor values and returns null for first-page access");

assert.throws(
  () =>
    decodeCursor({
      cursor: encoded,
      resource: "clothing",
      order: "desc",
      filters: { genre: "tops", status: ["ACTIVE"], limit: 50 },
      requestId: "req_order_mismatch",
    }),
  (error) => {
    assert.equal(isAppError(error), true);
    assert.equal(error.code, "INVALID_CURSOR");
    assert.equal(error.requestId, "req_order_mismatch");
    assert.deepEqual(error.details, {
      cursor: "order mismatch",
      expectedOrder: "desc",
      actualOrder: "asc",
    });
    return true;
  },
);
console.log("- decodeCursor rejects cursors whose order differs from the current request");

assert.throws(
  () =>
    decodeCursor({
      cursor: encoded,
      resource: "history",
      order: "asc",
      filters: { genre: "tops", status: ["ACTIVE"], limit: 50 },
    }),
  (error) => {
    assert.equal(error.code, "INVALID_CURSOR");
    assert.deepEqual(error.details, {
      cursor: "resource mismatch",
      expectedResource: "history",
      actualResource: "clothing",
    });
    return true;
  },
);
console.log("- decodeCursor rejects cursors created for another list API resource");

assert.throws(
  () =>
    decodeCursor({
      cursor: encoded,
      resource: "clothing",
      order: "asc",
      filters: { genre: "bottoms", status: ["ACTIVE"], limit: 50 },
      requestId: "req_filter_mismatch",
    }),
  (error) => {
    assert.equal(error.code, "INVALID_CURSOR");
    assert.equal(error.requestId, "req_filter_mismatch");
    assert.deepEqual(error.details, {
      cursor: "filter mismatch",
      expectedFilters: { genre: "bottoms", limit: 50, status: ["ACTIVE"] },
      actualFilters: { genre: "tops", limit: 50, status: ["ACTIVE"] },
    });
    return true;
  },
);
console.log("- decodeCursor rejects cursors whose retrieval conditions differ from the current request");

assert.throws(
  () => inspectCursor("not_base64", "req_malformed"),
  (error) => {
    assert.equal(error.code, "INVALID_CURSOR");
    assert.equal(error.requestId, "req_malformed");
    assert.deepEqual(error.details, { cursor: "cursor payload is not valid JSON" });
    return true;
  },
);
console.log("- inspectCursor reports malformed payloads as INVALID_CURSOR");

const appError = createAppError("INVALID_CURSOR", { details: { cursor: "cursor is malformed" } });
assert.equal(isAppError(appError), true);
console.log("- INVALID_CURSOR errors remain compatible with the shared AppError helpers");

console.log("BE-MS0-T09 cursor spec passed");
