import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const moduleUrl = pathToFileURL(path.join(root, "src/core/cursor/index.ts")).href;
const packageJsonPath = path.join(root, "package.json");
const ciPath = path.join(root, "..", "..", ".github", "workflows", "ci.yml");
const cursor = await import(moduleUrl);

const {
  createCursorEnvelope,
  decodeCursor,
  encodeCursor,
  invalidCursor,
} = cursor;

const clothingCursor = encodeCursor({
  resource: "clothing",
  order: "desc",
  criteria: { genre: "tops", limit: 50 },
  position: { lastEvaluatedPk: "CLOTHING#1735600000000", clothingId: "cl_01HZZAAA" },
});

const decodedClothingCursor = decodeCursor(clothingCursor, {
  resource: "clothing",
  order: "desc",
  criteria: { limit: 50, genre: "tops" },
});

assert.equal(decodedClothingCursor.version, 1);
assert.equal(decodedClothingCursor.resource, "clothing");
assert.equal(decodedClothingCursor.order, "desc");
assert.deepEqual(decodedClothingCursor.criteria, { genre: "tops", limit: 50 });
assert.deepEqual(decodedClothingCursor.position, {
  lastEvaluatedPk: "CLOTHING#1735600000000",
  clothingId: "cl_01HZZAAA",
});

const historyEnvelope = createCursorEnvelope({
  resource: "history",
  order: "asc",
  criteria: { from: "20260101", to: "20260131" },
  position: { date: "20260115", historyId: "hs_01HZZCCC" },
});
assert.equal(typeof historyEnvelope.value, "string");
assert.equal(historyEnvelope.value.length > 0, true);
assert.deepEqual(
  decodeCursor(historyEnvelope.value, {
    resource: "history",
    order: "asc",
    criteria: { to: "20260131", from: "20260101" },
  }).position,
  { date: "20260115", historyId: "hs_01HZZCCC" },
);

assert.throws(
  () =>
    decodeCursor(clothingCursor, {
      resource: "clothing",
      order: "asc",
      criteria: { genre: "tops", limit: 50 },
    }),
  (error) => error?.code === "INVALID_CURSOR" && error?.details?.order === "mismatched",
);

assert.throws(
  () =>
    decodeCursor(clothingCursor, {
      resource: "template",
      order: "desc",
      criteria: { genre: "tops", limit: 50 },
    }),
  (error) => error?.code === "INVALID_CURSOR" && error?.details?.resource === "mismatched",
);

assert.throws(
  () =>
    decodeCursor(clothingCursor, {
      resource: "clothing",
      order: "desc",
      criteria: { genre: "bottoms", limit: 50 },
    }),
  (error) => error?.code === "INVALID_CURSOR" && error?.details?.criteria === "mismatched",
);

assert.throws(
  () => decodeCursor("not-base64", { resource: "clothing", order: "desc", criteria: { genre: "tops", limit: 50 } }),
  (error) => error?.code === "INVALID_CURSOR",
);

assert.throws(
  () => {
    const malformed = Buffer.from(
      JSON.stringify({ version: 1, resource: "clothing", order: "desc", criteria: [], position: {} }),
      "utf8",
    ).toString("base64url");

    decodeCursor(malformed, { resource: "clothing", order: "desc", criteria: {} });
  },
  (error) => error?.code === "INVALID_CURSOR" && error?.details?.cursor === "criteria must be a flat object",
);

assert.equal(invalidCursor({ reason: "manual" }).code, "INVALID_CURSOR");

const packageJson = await fs.readFile(packageJsonPath, "utf8");
const ciSource = await fs.readFile(ciPath, "utf8");

assert.equal(
  packageJson.includes('"test:cursor": "node --import tsx/esm scripts/check-cursor-spec.mjs"'),
  true,
);
assert.equal(ciSource.includes("pnpm --filter api test:cursor"), true);

console.log("BE-MS0-T09 cursor spec passed");
console.log("- cursor encode/decode preserves position and normalizes criteria ordering");
console.log("- order/resource/filter mismatches are normalized to INVALID_CURSOR");
console.log("- malformed cursor payloads are rejected with INVALID_CURSOR");
console.log("- package script and CI include cursor spec test");
