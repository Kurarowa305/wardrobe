import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { load } from "./home-test-loader.mjs";
const require = createRequire(import.meta.url);
const { QueryClient } = require("@tanstack/react-query");
const { HomeController } = load("features/home/controller");
const context = {
  wardrobeId: "wd_test",
  regionRevision: 0,
  targetDate: "2026-10-11",
};
const ready = (mode, c = context) => ({
  ...c,
  mode,
  status: "ready",
  basis: "manual",
  items: [
    {
      templateId: mode,
      name: mode,
      revision: 1,
      tagIds: [],
      clothingItems: [],
    },
  ],
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
const pending = new Map();
let weatherCalls = 0;
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: Infinity } },
});
const controller = new HomeController(
  client,
  "wd_test",
  {
    region: async () => ({ revision: 0, region: null }),
    weather: async (c) => {
      weatherCalls++;
      return { ...c, status: "region_required", region: null };
    },
    recommendations: async (c, mode) => {
      const d = deferred();
      pending.set(mode, d);
      return d.promise;
    },
  },
  () => new Date("2026-10-11T02:00:00Z"),
);
await controller.enter();
await controller.selectMode("summer");
assert.equal(controller.getSnapshot().mode, "summer");
assert.equal(controller.getSnapshot().recommendations.status, "loading");
pending.get("summer").resolve(ready("summer"));
await new Promise((r) => setTimeout(r, 0));
assert.equal(
  controller.getSnapshot().recommendations.data.items[0].templateId,
  "summer",
);
pending.get("auto").resolve(ready("auto"));
await new Promise((r) => setTimeout(r, 0));
assert.equal(
  controller.getSnapshot().recommendations.data.items[0].templateId,
  "summer",
  "late auto response must not replace summer",
);
assert.equal(
  weatherCalls,
  1,
  "mode selection reuses independent daily weather",
);
controller.dispose();
await new Promise((r) => setTimeout(r, 0));
client.clear();
console.log(
  "PASS home runtime: mode selection rejects late responses and preserves weather cache",
);

const { invalidateRecommendations } = load("features/home/invalidation");
const { queryKeys } = load("api/queryKeys");
let now = new Date("2026-10-11T02:00:00Z");
let region = {
  revision: 1,
  region: {
    regionId: "abr:lg:131041",
    label: "東京都 新宿区",
    datasetVersion: "test",
  },
};
const calls = { weather: [], recommendations: [], region: 0 };
const daily = (c) => ({
  ...c,
  status: "available",
  provider: "open-meteo",
  modelPolicy: "best_match",
  timezone: "Asia/Tokyo",
  temperatureUnit: "celsius",
  fetchedAt: "2026-10-11T02:00:00Z",
  expiresAt:
    c.targetDate === "2026-10-11"
      ? "2026-10-11T15:00:00Z"
      : "2026-10-12T15:00:00Z",
  delivery: "fresh",
  daily: {
    temperatureMax: 22,
    temperatureMin: 15,
    apparentTemperatureMax: 20,
    weatherCode: 3,
  },
  derivation: { source: "apparent_temperature", dressingIndex: 2 },
});
const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, gcTime: Infinity } },
});
const tick = () => new Promise((r) => setTimeout(r, 0));
let fail = false;
const home = new HomeController(
  qc,
  "wd_test",
  {
    region: async () => {
      calls.region++;
      return region;
    },
    weather: async (c) => {
      calls.weather.push(c);
      return daily(c);
    },
    recommendations: async (c, mode) => {
      calls.recommendations.push({ ...c, mode });
      if (fail) throw new Error("DB unavailable");
      return ready(mode, c);
    },
  },
  () => now,
);
await home.enter();
await tick();
await home.selectMode("winter");
await tick();
now = new Date("2026-10-11T08:00:00Z");
await home.enter();
await tick();
assert.equal(home.getSnapshot().mode, "auto");
assert.equal(calls.region, 2);
assert.equal(
  calls.weather.length,
  1,
  "six hours and reentry reuse successful weather",
);
assert.equal(
  calls.recommendations.length,
  3,
  "reentry always refreshes recommendations",
);
await home.selectMode("autumn");
await tick();
await invalidateRecommendations(qc, "other");
await tick();
assert.equal(
  home.getSnapshot().mode,
  "autumn",
  "other wardrobe writes have no effect",
);
await invalidateRecommendations(qc, "wd_test", true);
await tick();
assert.equal(home.getSnapshot().mode, "auto", "record success resets mode");
assert.equal(home.getSnapshot().recorded, true);
assert.equal(
  calls.weather.length,
  1,
  "record does not invalidate daily weather",
);
assert.equal(
  qc.getQueryState(
    queryKeys.template.recommendation("wd_test", "winter", 1, "2026-10-11"),
  ).isInvalidated,
  true,
  "all modes invalidated",
);
region = { revision: 2, region: null };
await home.regionSaved(region);
await tick();
assert.equal(home.getSnapshot().weather.data.regionRevision, 2);
assert.equal(home.getSnapshot().recommendations.data.regionRevision, 2);
await home.selectMode("summer");
await tick();
now = new Date("2026-10-11T15:00:00Z");
await home.enter();
await tick();
assert.equal(home.getSnapshot().mode, "auto");
assert.equal(home.getSnapshot().targetDate, "2026-10-12");
assert.equal(calls.weather.length, 3, "next JST day loads new context");
fail = true;
const before = calls.recommendations.length;
await invalidateRecommendations(qc, "wd_test", true);
await tick();
assert.equal(home.getSnapshot().recommendations.status, "error");
assert.equal(
  home.getSnapshot().recorded,
  true,
  "refresh failure preserves record success",
);
assert.equal(
  home.getSnapshot().weather.status,
  "success",
  "recommendation failure independent of weather",
);
assert.equal(
  calls.recommendations.length,
  before + 1,
  "no automatic retry despite client retry=1",
);
home.dispose();
await tick();
qc.clear();
console.log(
  "PASS home lifecycle: reentry, six-hour weather reuse, scoped all-mode invalidation, record success, region revision, midnight, independent error, no retry",
);
const disposingClient = new QueryClient({
  defaultOptions: { queries: { gcTime: Infinity } },
});
let requestSignal;
const never = deferred();
const leaving = new HomeController(
  disposingClient,
  "wd_test",
  {
    region: async () => region,
    weather: async (c) => daily(c),
    recommendations: async (c, m, signal) => {
      requestSignal = signal;
      return never.promise;
    },
  },
  () => now,
);
await leaving.enter();
await tick();
leaving.dispose();
assert.equal(
  requestSignal.aborted,
  true,
  "leaving home aborts active requests",
);
await tick();
disposingClient.clear();
console.log("PASS leaving home aborts pending request");

// Conflicts restart with a newly read context, rather than retrying obsolete arguments.
const conflictClient = new QueryClient({
  defaultOptions: { queries: { gcTime: Infinity } },
});
let conflictRegion = 0;
let conflictRequests = [];
const conflict = new HomeController(
  conflictClient,
  "wd_test",
  {
    region: async () => ({ revision: conflictRegion++, region: null }),
    weather: async (c) => ({ ...c, status: "region_required", region: null }),
    recommendations: async (c, mode) => {
      conflictRequests.push(c.regionRevision);
      if (c.regionRevision === 0)
        throw { details: { reason: "REGION_CHANGED" } };
      return ready(mode, c);
    },
  },
  () => new Date("2026-10-11T02:00:00Z"),
);
await conflict.enter();
await tick();
await tick();
assert.deepEqual(conflictRequests, [0, 1]);
assert.equal(conflict.getSnapshot().recommendations.data.regionRevision, 1);
conflict.dispose();
await tick();
conflictClient.clear();
console.log(
  "PASS context conflict refreshes region and never retries obsolete revision",
);

const raceClient = new QueryClient({
  defaultOptions: { queries: { gcTime: Infinity } },
});
let clock = new Date("2026-10-11T14:59:59Z");
let selectedRegion = { revision: 1, region: null };
const races = [];
const racing = new HomeController(
  raceClient,
  "wd_test",
  {
    region: async () => selectedRegion,
    weather: async (c) => daily(c),
    recommendations: async (c, mode) => {
      const d = deferred();
      races.push({ c, mode, ...d });
      return d.promise;
    },
  },
  () => clock,
);
await racing.enter();
await tick();
selectedRegion = { revision: 2, region: null };
await racing.regionSaved(selectedRegion);
await tick();
races[0].resolve(ready("auto", races[0].c));
await tick();
assert.equal(
  racing.getSnapshot().recommendations.status,
  "loading",
  "old region response discarded",
);
clock = new Date("2026-10-11T15:00:01Z");
races[1].resolve(ready("auto", races[1].c));
await tick();
await tick();
assert.equal(
  racing.getSnapshot().targetDate,
  "2026-10-12",
  "response detects midnight even when timer suspended",
);
assert.equal(
  racing.getSnapshot().recommendations.status,
  "loading",
  "previous day card never displayed",
);
races[2].resolve(ready("auto", races[2].c));
await tick();
assert.equal(
  racing.getSnapshot().recommendations.data.targetDate,
  "2026-10-12",
);
racing.dispose();
await tick();
raceClient.clear();
console.log(
  "PASS late region and midnight responses cannot become current cards",
);
