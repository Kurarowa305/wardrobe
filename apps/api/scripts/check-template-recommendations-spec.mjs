import assert from "node:assert/strict";
import { getTemplateRecommendationsHandler } from "../src/domains/template/recommendations/handler.ts";
const now = () => Date.parse("2026-10-11T02:00:00Z");
const template = (id, ids, extra = {}) => ({
  templateId: id,
  name: id,
  status: "ACTIVE",
  clothingIds: ids,
  tagIds: ["season:summer"],
  createdAt: 1,
  ...extra,
});
const clothing = (id, lastWornAt, extra = {}) => ({
  clothingId: id,
  imageKey: null,
  status: "ACTIVE",
  lastWornAt,
  ...extra,
});
const templates = [
  template("recent", ["yesterday", "old"]),
  template("better", ["five", "six"]),
];
const clothes = [
  clothing("yesterday", 100),
  clothing("old", 1),
  clothing("five", 80),
  clothing("six", 70),
];
const repository = {
  async readTemplates() {
    return { items: templates };
  },
  async readClothing() {
    return { items: clothes, unprocessed: false };
  },
};
const weatherRepository = {
  async readContext() {
    return { revision: 0, region: null };
  },
};
const input = {
  path: { wardrobeId: "wd_test" },
  query: { mode: "summer", date: "2026-10-11", regionRevision: "0" },
  dependencies: {
    repository,
    weatherRepository,
    now,
    resolveForecast: () => {
      throw Error("manual must not fetch weather");
    },
  },
};
const response = await getTemplateRecommendationsHandler(input);
assert.deepEqual(
  response.json.items.map((x) => x.templateId),
  ["better", "recent"],
);
assert.equal(response.json.basis, "manual");
assert.equal(response.json.items[0].revision, 0);
console.log(
  "Manual recommendation ranks max clothing lastWornAt, without weather OK",
);
const autoInput = { ...input, query: { ...input.query, mode: "auto" } };
assert.equal(
  (await getTemplateRecommendationsHandler(autoInput)).json.status,
  "region_required",
);
const regional = {
  readContext: async () => ({
    revision: 0,
    region: { regionId: "abr:lg:131041", latitude: 35, longitude: 139 },
  }),
};
const forecast = async () => ({
  status: "available",
  daily: { apparentTemperatureMax: 20, temperatureMax: 27 },
  derivation: { source: "apparent_temperature", dressingIndex: 2 },
});
const seasonal = {
  ...repository,
  readTemplates: async () => ({
    items: [
      template("spring", ["five"], { tagIds: ["season:spring"] }),
      template("autumn", ["six"], { tagIds: ["season:autumn"] }),
      template("all", ["old"], { tagIds: ["season:all"] }),
    ],
  }),
};
const auto = {
  ...autoInput,
  dependencies: {
    ...input.dependencies,
    weatherRepository: regional,
    repository: seasonal,
    resolveForecast: forecast,
  },
};
const result = (await getTemplateRecommendationsHandler(auto)).json;
assert.deepEqual(
  result.items.map((x) => x.templateId),
  ["all", "autumn", "spring"],
);
assert.equal(result.basis, "apparent_temperature");
// Later pages can contain the best candidate; true missing/deleted clothing excludes only its candidate.
let pages = 0;
const paginated = {
  readTemplates: async (id, cursor) => {
    pages++;
    return cursor
      ? {
          items: [
            template("best", ["never"]),
            template("missing", ["absent"]),
            template("deleted", ["gone"]),
            template("untagged", ["never"], { tagIds: [] }),
          ],
        }
      : { items: templates, cursor: { PK: "next", SK: "next" } };
  },
  readClothing: async () => ({
    items: [
      ...clothes,
      clothing("never", 0),
      clothing("gone", 0, { status: "DELETED" }),
    ],
    unprocessed: false,
  }),
};
const later = (
  await getTemplateRecommendationsHandler({
    ...input,
    dependencies: { ...input.dependencies, repository: paginated },
  })
).json;
assert.deepEqual(
  later.items.map((x) => x.templateId),
  ["best", "better", "recent"],
);
assert.equal(pages, 2);
// Equal maxima: creation ascending then ID; shared clothing stays in all three results.
const ties = {
  ...repository,
  readTemplates: async () => ({
    items: [
      template("z", ["old"], { createdAt: 2 }),
      template("b", ["old"]),
      template("a", ["old"]),
    ],
  }),
};
assert.deepEqual(
  (
    await getTemplateRecommendationsHandler({
      ...input,
      dependencies: { ...input.dependencies, repository: ties },
    })
  ).json.items.map((x) => x.templateId),
  ["a", "b", "z"],
);
let failures = 0;
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      repository: {
        ...repository,
        readClothing: async () => {
          failures++;
          return { items: clothes, unprocessed: true };
        },
      },
    },
  }),
  (e) => e.status === 503,
);
assert.equal(failures, 1);
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      repository: {
        ...repository,
        readTemplates: async () => {
          throw Error("throttled");
        },
      },
    },
  }),
  (e) => e.status === 503,
);
for (const query of [
  { ...input.query, mode: "bad" },
  { ...input.query, mode: ["summer", "winter"] },
  { ...input.query, limit: "3" },
  { ...input.query, date: "2026-02-30" },
  { ...input.query, regionRevision: "1.0" },
  { ...input.query, regionRevision: "-1" },
  { ...input.query, regionRevision: "9007199254740992" },
])
  await assert.rejects(
    getTemplateRecommendationsHandler({ ...input, query }),
    (e) => e.status === 400,
  );
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    query: { ...input.query, date: "2026-10-10" },
  }),
  (e) => e.details.reason === "TARGET_DATE_CHANGED",
);
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    query: { ...input.query, regionRevision: "1" },
  }),
  (e) => e.details.reason === "REGION_CHANGED",
);
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      weatherRepository: { readContext: async () => null },
    },
  }),
  (e) => e.status === 404,
);
const unavailable = {
  ...auto,
  dependencies: {
    ...auto.dependencies,
    resolveForecast: async () => ({
      status: "unavailable",
      reason: "cooldown",
      retryAfter: null,
    }),
  },
};
assert.equal(
  (await getTemplateRecommendationsHandler(unavailable)).json.status,
  "weather_required",
);
for (const [temperature, expected] of [
  [14.999, "winter"],
  [15, "spring"],
  [24.999, "spring"],
  [25, "summer"],
]) {
  const d = {
    ...auto.dependencies,
    repository: {
      ...repository,
      readTemplates: async () => ({
        items: ["winter", "spring", "summer"].map((s) =>
          template(s, ["old"], { tagIds: [`season:${s}`] }),
        ),
      }),
    },
    resolveForecast: async () => ({
      status: "available",
      daily: { apparentTemperatureMax: temperature, temperatureMax: 40 },
    }),
  };
  assert.equal(
    (await getTemplateRecommendationsHandler({ ...auto, dependencies: d })).json
      .items[0].templateId,
    expected,
  );
}
const fallback = (
  await getTemplateRecommendationsHandler({
    ...auto,
    dependencies: {
      ...auto.dependencies,
      repository,
      resolveForecast: async () => ({
        status: "available",
        daily: { apparentTemperatureMax: null, temperatureMax: 25 },
      }),
    },
  })
).json;
assert.equal(fallback.basis, "temperature_max_fallback");
assert.equal(fallback.items[0].templateId, "better");
assert.equal(
  (
    await getTemplateRecommendationsHandler({
      ...auto,
      dependencies: {
        ...auto.dependencies,
        resolveForecast: async () => ({
          status: "available",
          daily: { apparentTemperatureMax: null, temperatureMax: null },
        }),
      },
    })
  ).json.status,
  "weather_required",
);
let contexts = 0;
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      weatherRepository: {
        readContext: async () => ({
          revision: contexts++ ? 1 : 0,
          region: null,
        }),
      },
    },
  }),
  (e) => e.details.reason === "REGION_CHANGED",
);
let time = now();
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      now: () => time,
      repository: {
        ...repository,
        readTemplates: async () => {
          time = Date.parse("2026-10-11T15:00:00Z");
          return { items: [] };
        },
      },
    },
  }),
  (e) => e.status === 503 || e.details.reason === "TARGET_DATE_CHANGED",
);
console.log(
  "Paging, full candidate completeness, stable ties, query validation, contexts and temperature boundaries OK",
);
// Real deadlines propagate to pending I/O and never start the next page after timeout.
let aborted = false,
  reads = 0;
const slow = {
  readTemplates: async (_id, _cursor, signal) => {
    reads++;
    return new Promise((resolve, reject) =>
      signal.addEventListener(
        "abort",
        () => {
          aborted = true;
          reject(Error("aborted"));
        },
        { once: true },
      ),
    );
  },
  readClothing: async () => {
    throw Error("must not run");
  },
};
const realNow = Date.now;
const jst = new Date(realNow() + 9 * 3600000).toISOString().slice(0, 10);
let started = performance.now();
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    query: { ...input.query, date: jst },
    dependencies: { ...input.dependencies, now: realNow, repository: slow },
  }),
  (e) => e.status === 503,
);
assert.equal(aborted, true);
assert.equal(reads, 1);
assert.ok(performance.now() - started < 5700);
aborted = false;
started = performance.now();
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    startedAt: realNow() - 9980,
    query: { ...input.query, date: jst },
    dependencies: { ...input.dependencies, now: realNow, repository: slow },
  }),
  (e) => e.status === 503,
);
assert.equal(aborted, true);
assert.ok(performance.now() - started < 500);
let midnight = Date.parse("2026-10-11T14:59:59.999Z");
await assert.rejects(
  getTemplateRecommendationsHandler({
    ...input,
    dependencies: {
      ...input.dependencies,
      now: () => midnight,
      repository: {
        ...repository,
        readTemplates: async () => {
          midnight += 2;
          return { items: [] };
        },
      },
    },
  }),
  (e) => e.details.reason === "TARGET_DATE_CHANGED",
);
console.log(
  "5s DB and ingress 10s deadlines abort pending work; JST midnight discards old response OK",
);
