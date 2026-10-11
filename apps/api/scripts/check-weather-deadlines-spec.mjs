import assert from "node:assert/strict";
import { createWeatherService } from "../src/domains/weather/service.ts";
import { WeatherBudget } from "../src/domains/weather/budget.ts";
const region = { regionId: "abr:lg:131041", latitude: 35.69, longitude: 139.7 };
const input = { wardrobeId: "wd_test", date: "2026-10-11", regionRevision: 1 };
const reference = Date.parse("2026-10-11T01:00:00Z");
let time = reference;
let sends = 0,
  aborted = false;
const repository = {
  readContext: async () => ({ revision: 1, region }),
  readState: async () => null,
  acquire: async () => true,
  readUsage: async () => null,
  reserve: async () => true,
  finish: async () => true,
  gate: async () => {},
};
// A database lookup consumes the shared five-second read budget and prevents later sends.
const slowDb = createWeatherService({
  now: () => time,
  repository: {
    ...repository,
    readContext: async () => {
      time += 5000;
      return { revision: 1, region };
    },
  },
  fetch: async () => {
    sends++;
    throw Error("not allowed");
  },
});
await assert.rejects(
  slowDb.get(input),
  (e) => e.code === "SERVICE_UNAVAILABLE",
);
assert.equal(sends, 0);
// Actual AbortSignal is delivered when the overall request deadline expires.
const realStart = Date.now();
const hungDb = createWeatherService({
  repository: {
    ...repository,
    readContext: async (id, signal) =>
      new Promise((resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(Error("aborted"));
          },
          { once: true },
        ),
      ),
  },
});
await assert.rejects(
  hungDb.get(
    {
      ...input,
      date: new Date(Date.now() + 32400000).toISOString().slice(0, 10),
    },
    new WeatherBudget(Date.now, realStart - 9980),
  ),
  (e) => e.code === "SERVICE_UNAVAILABLE",
);
assert.equal(aborted, true);
assert.ok(Date.now() - realStart < 1000);
// Four-second external timeout aborts the transport and returns unavailable with no retry.
let attempts = 0,
  fetchAborted = false;
const timeout = createWeatherService({
  repository,
  now: () => reference,
  fetch: async (url, { signal }) => {
    attempts++;
    return new Promise((resolve, reject) =>
      signal.addEventListener(
        "abort",
        () => {
          fetchAborted = true;
          reject(Error("aborted"));
        },
        { once: true },
      ),
    );
  },
});
const timed = await timeout.get(input);
assert.equal(timed.reason, "fetch_failed");
assert.equal(attempts, 1);
assert.equal(fetchAborted, true);
// A delayed usage reservation may consume a slot, but cannot send in a different bucket.
time = reference;
const delayed = createWeatherService({
  repository: {
    ...repository,
    reserve: async () => {
      time += 1000;
      return true;
    },
  },
  now: () => time,
  fetch: async () => {
    sends++;
    throw Error("not allowed");
  },
});
assert.equal((await delayed.get(input)).reason, "fetch_in_progress");
assert.equal(sends, 0);
// A late response after JST midnight is rejected even when the forecast was valid for the old date.
time = Date.parse("2026-10-11T14:59:59Z");
const midnight = createWeatherService({
  repository: {
    ...repository,
    readContext: async () => {
      const result = { revision: 1, region: null };
      if (time === Date.parse("2026-10-11T14:59:59Z")) time += 1000;
      return result;
    },
  },
  now: () => time,
});
await assert.rejects(
  midnight.get(input),
  (e) => e.details.reason === "TARGET_DATE_CHANGED",
);
console.log(
  "weather deadlines: cumulative DB, entry deadline, provider abort/no retry, delayed reservation, JST rollover passed",
);
