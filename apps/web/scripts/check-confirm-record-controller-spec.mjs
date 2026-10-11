import assert from "node:assert/strict";
import { load } from "./home-test-loader.mjs";
const { ConfirmationController } = load("features/record/confirmation");
const memory = new Map();
const storage = {
  get length() { return memory.size; },
  key: (index) => [...memory.keys()][index] ?? null,
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
const item = {
  templateId: "tp_a",
  revision: 1,
  name: "A",
  tagIds: [],
  clothingItems: [],
};
let calls = 0;
const sent = [];
const deps = {
  storage: () => storage,
  uuid: () => "550e8400-e29b-41d4-a716-446655440000",
  now: () => new Date("2026-10-11T15:30:00Z"),
  create: async (body, key) => {
    calls++;
    sent.push({ body, key });
    if (calls === 1) throw Error("network");
    return { historyId: "hs_a" };
  },
  refreshTemplate: async () => ({ ...item, revision: 2 }),
  onSuccess: () => {},
};
const controller = new ConfirmationController("wd_a", deps);
controller.open(item);
assert.equal(controller.getSnapshot().date, "2026-10-12");
controller.setDate("2026-11-01");
await controller.submit();
assert.equal(controller.getSnapshot().phase, "unknown");
controller.setDate("2026-12-01");
assert.equal(controller.getSnapshot().date, "2026-11-01");
const restored = new ConfirmationController("wd_a", deps);
assert.equal(restored.getSnapshot().phase, "unknown");
await restored.submit();
assert.deepEqual(sent[1], sent[0]);
assert.equal(memory.size, 0);
assert.equal(restored.getSnapshot().open, false);
console.log("confirmation pending restore and stable replay passed");
const inaccessible = new ConfirmationController("wd_storage", {
  ...deps,
  storage: () => ({
    ...storage,
    setItem: () => {
      throw Error("quota");
    },
  }),
});
inaccessible.open(item);
await inaccessible.submit();
assert.equal(calls, 2);
assert.equal(inaccessible.getSnapshot().message, "storage");
let complete;
const held = new ConfirmationController("wd_hold", {
  ...deps,
  create: async () => {
    calls++;
    return new Promise((resolve) => (complete = resolve));
  },
});
held.open(item);
held.close();
assert.equal(calls, 2);
held.open(item);
held.setDate("2030-01-01");
const inflight = held.submit();
held.close();
held.setDate("2031-01-01");
await held.submit();
assert.equal(held.getSnapshot().open, true);
assert.equal(held.getSnapshot().date, "2030-01-01");
assert.equal(calls, 3);
complete({ historyId: "hs_b" });
await inflight;
const stale = new ConfirmationController("wd_stale", {
  ...deps,
  create: async () => {
    throw { status: 409, details: { reason: "CONFIRMATION_STALE" } };
  },
});
stale.open(item);
stale.setDate("2026-12-31");
await stale.submit();
assert.equal(stale.getSnapshot().date, "2026-12-31");
assert.equal(stale.getSnapshot().template.revision, 2);
assert.equal(stale.getSnapshot().phase, "editing");
console.log(
  "confirmation storage failure, cancel, double submit, frozen input and stale reconfirm passed",
);

// Two already-mounted tabs must retain independent uncertain operations.
const tabA = new ConfirmationController("wd_tabs", { ...deps, create: async () => { throw Error("lost A"); } });
const tabB = new ConfirmationController("wd_tabs", { ...deps, uuid: () => "550e8400-e29b-41d4-a716-446655440001", create: async () => { throw Error("lost B"); } });
tabA.open(item); tabB.open(item);
await Promise.all([tabA.submit(), tabB.submit()]);
assert.equal(memory.size, 2);
let replayedKey;
const resume = () => new ConfirmationController("wd_tabs", { ...deps, create: async (_body, key) => { replayedKey = key; return { historyId: key }; } });
await resume().submit();
assert.equal(memory.size, 1);
const firstKey = replayedKey;
await resume().submit();
assert.notEqual(replayedKey, firstKey);
assert.equal(memory.size, 0);
console.log("independent tab operations survive concurrent writes and individual cleanup");
