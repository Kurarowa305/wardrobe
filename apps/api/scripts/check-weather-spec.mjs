import assert from "node:assert/strict";
import { parseForecast } from "../src/domains/weather/forecast.ts";
const fixture = (a = 20) => ({
  timezone: "Asia/Tokyo",
  utc_offset_seconds: 32400,
  daily_units: {
    time: "iso8601",
    apparent_temperature_max: "°C",
    temperature_2m_max: "°C",
    temperature_2m_min: "°C",
    weather_code: "wmo code",
  },
  daily: {
    time: ["2026-10-11"],
    apparent_temperature_max: [a],
    temperature_2m_max: [18],
    temperature_2m_min: [5],
    weather_code: [3],
  },
});
assert.deepEqual(parseForecast(fixture(14.999), "2026-10-11").derivation, {
  source: "apparent_temperature",
  dressingIndex: 1,
});
console.log("weather: forecast boundary passed");
export { fixture };
for (const [temperature, index] of [
  [-8, 1],
  [15, 2],
  [24.999, 2],
  [25, 3],
  [38, 3],
])
  assert.equal(
    parseForecast(fixture(temperature), "2026-10-11").derivation.dressingIndex,
    index,
  );
for (const temperature of [null, "20", Infinity, undefined])
  assert.deepEqual(
    parseForecast(
      fixture(temperature === undefined ? null : temperature),
      "2026-10-11",
    ).derivation,
    { source: "temperature_max_fallback", dressingIndex: null },
  );
const broken = fixture();
broken.daily.temperature_2m_max = [];
assert.throws(() => parseForecast(broken, "2026-10-11"));
assert.throws(() => parseForecast(fixture(), "2026-10-12"));
const { createWeatherService } =
  await import("../src/domains/weather/service.ts");
const service = createWeatherService({
  repository: { readContext: async () => ({ revision: 0, region: null }) },
  now: () => Date.parse("2026-10-11T01:00:00Z"),
});
assert.deepEqual(
  await service.get({
    wardrobeId: "wd_test",
    date: "2026-10-11",
    regionRevision: 0,
  }),
  {
    wardrobeId: "wd_test",
    targetDate: "2026-10-11",
    regionRevision: 0,
    status: "region_required",
    region: null,
  },
);
const region = { regionId: "abr:lg:131041", latitude: 35.69, longitude: 139.7 };
const memory = { state: null, usage: null };
const repo = {
  readContext: async () => ({ revision: 1, region }),
  readState: async () => memory.state,
  acquire: async (key, owner, until) => {
    memory.state = { ...memory.state, leaseOwner: owner, leaseUntil: until };
    return true;
  },
  readUsage: async () => memory.usage,
  reserve: async (previous, next) => {
    memory.usage = next;
    return true;
  },
  finish: async (key, owner, now, result) => {
    if (memory.state.leaseOwner !== owner || memory.state.leaseUntil <= now)
      return false;
    memory.state = { ...memory.state, ...result, leaseUntil: 0 };
    return true;
  },
  gate: async () => {},
};
let requests = 0;
const shared = createWeatherService({
  repository: repo,
  now: () => Date.parse("2026-10-11T01:00:00Z"),
  fetch: async () => {
    requests++;
    return new Response(JSON.stringify(fixture()));
  },
});
const fresh = await shared.get({
  wardrobeId: "wd_test",
  date: "2026-10-11",
  regionRevision: 1,
});
assert.equal(fresh.status, "available");
assert.equal(fresh.delivery, "fresh");
const cache = await shared.get({
  wardrobeId: "wd_other",
  date: "2026-10-11",
  regionRevision: 1,
});
assert.equal(cache.delivery, "cache");
assert.equal(requests, 1);
const { getWeatherHandler } = await import("../src/domains/weather/handler.ts");
await assert.rejects(
  getWeatherHandler({
    path: { wardrobeId: "wd_test" },
    query: { date: "2026-10-11", regionRevision: "1", extra: "x" },
    dependencies: { repository: repo },
  }),
  (e) => e.code === "VALIDATION_ERROR",
);
// Public input errors and context mismatches are distinct from missing forecasts.
for (const query of [
  { date: "2026-02-30", regionRevision: "1" },
  { date: "2026-10-11", regionRevision: ["1", "1"] },
  { date: "2026-10-11", regionRevision: "1.0" },
  { date: "2026-10-11", regionRevision: "-1" },
  { date: "2026-10-11", regionRevision: "9007199254740992" },
])
  await assert.rejects(
    getWeatherHandler({ path: { wardrobeId: "wd_test" }, query }),
    (e) => e.code === "VALIDATION_ERROR",
  );
await assert.rejects(
  shared.get({ wardrobeId: "wd_test", date: "2026-10-10", regionRevision: 1 }),
  (e) => e.details.reason === "TARGET_DATE_CHANGED",
);
await assert.rejects(
  shared.get({ wardrobeId: "wd_test", date: "2026-10-11", regionRevision: 0 }),
  (e) => e.details.reason === "REGION_CHANGED",
);
// Invalid individual values remain null; no guessed temperature or code.
for (const key of [
  "apparent_temperature_max",
  "temperature_2m_max",
  "temperature_2m_min",
  "weather_code",
]) {
  const input = fixture();
  input.daily[key] = [null];
  assert.equal(
    Object.values(parseForecast(input, "2026-10-11").daily).filter(
      (v) => v === null,
    ).length,
    1,
  );
}
const unit = fixture();
unit.daily_units.apparent_temperature_max = "°F";
assert.equal(
  parseForecast(unit, "2026-10-11").derivation.source,
  "temperature_max_fallback",
);
const unknown = fixture();
unknown.daily.weather_code = [7];
assert.equal(parseForecast(unknown, "2026-10-11").daily.weatherCode, null);
assert.equal(
  parseForecast(fixture(13), "2026-10-11").derivation.dressingIndex,
  1,
);
const dayRange = fixture(26);
dayRange.daily.temperature_2m_min = [5];
assert.equal(parseForecast(dayRange, "2026-10-11").derivation.dressingIndex, 3);
// Fixed usage boundaries: conservative buckets, UTC day/month rollover, 80%, 100%.
const { reserveUsage } = await import("../src/domains/weather/usage.ts");
let usage = null;
const instant = Date.parse("2026-10-11T01:00:00Z");
for (let i = 1; i <= 60; i++) {
  const result = reserveUsage(usage, instant);
  assert.ok("usage" in result);
  if (i === 48) assert.equal(result.warning, true);
  usage = result.usage;
}
assert.equal(reserveUsage(usage, instant + 60000).reason, "budget_exhausted");
assert.ok("usage" in reserveUsage(usage, instant + 61000));
for (const [field, limit] of [
  ["minutes", 600],
  ["hours", 5000],
  ["days", 150000],
]) {
  const base = reserveUsage(null, instant).usage;
  const width = { minutes: 60000, hours: 3600000, days: 86400000 }[field];
  base[field] = { [Math.floor(instant / width)]: limit };
  assert.equal(reserveUsage(base, instant).reason, "budget_exhausted");
}
const month = reserveUsage(null, Date.parse("2026-10-31T23:59:59Z")).usage;
month.monthCount = 150000;
month.days = {};
assert.equal(
  reserveUsage(month, Date.parse("2026-10-31T23:59:59Z")).reason,
  "budget_exhausted",
);
assert.equal(
  reserveUsage(month, Date.parse("2026-11-01T00:00:00Z")).usage.monthCount,
  1,
);
console.log(
  "weather: validation, derivation, cache and quota boundaries passed",
);
await assert.rejects(
  getWeatherHandler({
    path: { wardrobeId: "wd_test" },
    query: { date: "2026-10-11", regionRevision: "1", wardrobeId: "wd_other" },
    dependencies: { repository: repo, now: () => instant },
  }),
  (e) => e.code === "VALIDATION_ERROR",
);
// Exercise production dispatch (not just the injected service) without contacting any network.
const { createLambdaHandler } = await import("../src/entry/lambda/adapter.ts");
const lambda = createLambdaHandler({
  domain: "wardrobe",
  logger: { info() {}, error() {}, warn() {} },
});
const response = await lambda({
  rawPath: "/wardrobes/wd_test/weather",
  rawQueryString: "date=2000-01-01&regionRevision=0",
  pathParameters: { wardrobeId: "wd_test" },
  requestContext: { http: { method: "GET" } },
});
assert.equal(response.statusCode, 409);
assert.equal(
  JSON.parse(response.body).error.details.reason,
  "TARGET_DATE_CHANGED",
);
const { createLocalRouter } = await import("../src/entry/local/router.ts");
const local = await createLocalRouter().dispatch({
  url: "/wardrobes/wd_test/weather?date=2026-10-11&regionRevision=0&regionRevision=0",
  method: "GET",
  headers: {},
});
assert.equal(local.response.statusCode, 400);
for (const temperature of [14.9, 15, 24.9, 25]) {
  const value = fixture(null);
  value.daily.temperature_2m_max = [temperature];
  const fallback = parseForecast(value, "2026-10-11");
  assert.equal(fallback.daily.temperatureMax, temperature);
  assert.deepEqual(fallback.derivation, {
    source: "temperature_max_fallback",
    dressingIndex: null,
  });
}
console.log(
  "weather: production Lambda/local routing and fallback boundaries passed",
);
