import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";

// Only the provider boundary is replaced. Every application request uses the real
// Web endpoint/client -> HTTP router -> production repository -> DynamoDB Local.
process.env.DDB_ENDPOINT ??= "http://127.0.0.1:8765";
assert.match(
  process.env.DDB_ENDPOINT,
  /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
);
process.env.TABLE_NAME = `HomeIntegration${Date.now()}${randomUUID().slice(0, 8)}`;
process.env.AWS_REGION = "ap-northeast-1";
process.env.S3_BUCKET = "integration-images";
process.env.IMAGE_PUBLIC_BASE_URL = "http://127.0.0.1/images";
process.env.STORAGE_DRIVER = "local";
const dynamo = new DynamoDBClient({
  endpoint: process.env.DDB_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
  maxAttempts: 1,
});
const indexes = [
  ["StatusListByCreatedAt", "statusListPk", "createdAtSk"],
  ["StatusGenreListByCreatedAt", "statusGenreListPk", "createdAtSk"],
  ["StatusListByWearCount", "statusListPk", "wearCountSk"],
  ["StatusListByLastWornAt", "statusListPk", "lastWornAtSk"],
  ["HistoryByDate", "PK", "historyDateSk"],
];
await dynamo.send(
  new CreateTableCommand({
    TableName: process.env.TABLE_NAME,
    BillingMode: "PAY_PER_REQUEST",
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      ...new Set(["PK", "SK", ...indexes.flatMap(([, pk, sk]) => [pk, sk])]),
    ].map((AttributeName) => ({ AttributeName, AttributeType: "S" })),
    GlobalSecondaryIndexes: indexes.map(([IndexName, pk, sk]) => ({
      IndexName,
      KeySchema: [
        { AttributeName: pk, KeyType: "HASH" },
        { AttributeName: sk, KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    })),
  }),
);
const nativeFetch = globalThis.fetch;
const nativeWarn = console.warn;
const document = DynamoDBDocumentClient.from(dynamo);
let providerCalls = 0;
let apparent = 20;
let temperature = 27;
let failForecast = false;
const calls = [];
globalThis.fetch = async (resource, options) => {
  const url = new URL(
    resource instanceof Request ? resource.url : String(resource),
  );
  if (url.hostname === "api.open-meteo.com") {
    providerCalls++;
    assert.equal(url.pathname, "/v1/forecast");
    assert.equal(url.searchParams.get("timezone"), "Asia/Tokyo");
    assert.equal(url.searchParams.get("models"), "best_match");
    assert.equal(url.searchParams.get("temperature_unit"), "celsius");
    assert.equal(
      url.searchParams.get("start_date"),
      url.searchParams.get("end_date"),
    );
    assert.ok(options.signal instanceof AbortSignal);
    if (failForecast) return new Response("unavailable", { status: 503 });
    return Response.json({
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
        time: [url.searchParams.get("start_date")],
        apparent_temperature_max: [apparent],
        temperature_2m_max: [temperature],
        temperature_2m_min: [10],
        weather_code: [3],
      },
    });
  }
  assert.equal(
    url.hostname,
    "127.0.0.1",
    `Unexpected external request: ${url.hostname}`,
  );
  calls.push({ path: url.pathname, method: options?.method ?? "GET" });
  return nativeFetch(resource, options);
};
let server;
try {
  const { createLocalServer } = await import("../src/entry/local/server.ts");
  server = createLocalServer({ logger: { info() {}, error() {} } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  process.env.NEXT_PUBLIC_API_BASE_URL = baseUrl;
  const { load } = await import("../../web/scripts/home-test-loader.mjs");
  const { createWardrobe } = load("api/endpoints/wardrobe");
  const { createClothing, getClothing, updateClothing, deleteClothing } = load(
    "api/endpoints/clothing",
  );
  const { createTemplate, getTemplate, updateTemplate } = load(
    "api/endpoints/template",
  );
  const { searchRegions, saveWardrobeRegion, getWardrobeRegion } = load(
    "api/endpoints/region",
  );
  const { getWeather, getTemplateRecommendations } = load("api/endpoints/home");
  const { createHistory, deleteHistory, listHistories, getHistory } = load(
    "api/endpoints/history",
  );
  const { createApiClient } = load("api/client");
  const secondClient = createApiClient({ baseUrl });
  const { wardrobeId } = await createWardrobe({ name: "結合ワードローブ" });
  const targetDate = new Date(Date.now() + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
  const context = { wardrobeId, regionRevision: 0, targetDate };
  assert.deepEqual(await getWardrobeRegion(wardrobeId), {
    revision: 0,
    region: null,
  });
  assert.equal((await getWeather(context)).status, "region_required");
  assert.equal(providerCalls, 0);
  const search = await searchRegions("ｼﾝｼﾞｭｸ");
  assert.equal(search.items[0].regionId, "abr:lg:131041");
  const saved = await saveWardrobeRegion(wardrobeId, {
    regionId: search.items[0].regionId,
    datasetVersion: search.datasetVersion,
    expectedRevision: 0,
  });
  assert.deepEqual(
    await secondClient.get(`/wardrobes/${wardrobeId}/region`),
    saved,
    "independent client sees server region",
  );
  await assert.rejects(
    getWeather(context),
    (e) => e.status === 409 && e.details.reason === "REGION_CHANGED",
  );
  context.regionRevision = saved.revision;
  const clothes = [];
  for (let i = 0; i < 21; i++) {
    const created = await createClothing(wardrobeId, {
      name: `服${i}`,
      genre: i % 2 ? "bottoms" : "tops",
      imageKey: `clothing/integration-${i}.png`,
      tagIds: [],
    });
    assert.ok(created.clothingId);
    clothes.push(created.clothingId);
  }
  const A = (
    await createTemplate(wardrobeId, {
      name: "春20服",
      clothingIds: clothes.slice(0, 20),
      tagIds: ["season:spring"],
    })
  ).templateId;
  const B = (
    await createTemplate(wardrobeId, {
      name: "秋共有服",
      clothingIds: [clothes[0]],
      tagIds: ["season:autumn"],
    })
  ).templateId;
  const C = (
    await createTemplate(wardrobeId, {
      name: "独立all",
      clothingIds: [clothes[20]],
      tagIds: ["season:all"],
    })
  ).templateId;
  const ids = (result) => result.items.map((item) => item.templateId);
  assert.deepEqual(ids(await getTemplateRecommendations(context, "summer")), [
    C,
  ]);
  assert.equal(providerCalls, 0, "manual does not fetch weather");
  const initial = await getTemplateRecommendations(context, "auto");
  assert.deepEqual(ids(initial), [A, B, C]);
  assert.equal(initial.basis, "apparent_temperature");
  assert.equal(initial.items[0].clothingItems.length, 20);
  assert.equal(initial.items[0].revision, 1);
  const weather = await getWeather(context);
  assert.equal(weather.delivery, "cache");
  assert.equal(weather.derivation.dressingIndex, 2);
  assert.equal(weather.daily.temperatureMax, 27);
  assert.equal(providerCalls, 1);
  const date = targetDate.replaceAll("-", "");
  const operation = randomUUID();
  const body = {
    date,
    templateId: A,
    expectedTemplateRevision: initial.items[0].revision,
  };
  const first = await createHistory(wardrobeId, body, operation);
  assert.equal(
    (await createHistory(wardrobeId, body, operation)).historyId,
    first.historyId,
  );
  assert.equal(
    (await getHistory(wardrobeId, first.historyId)).clothingItems.length,
    20,
  );
  assert.deepEqual(
    ids(await getTemplateRecommendations(context, "auto")),
    [C, A, B],
    "record changes both shared-clothing candidates",
  );
  const second = await createHistory(wardrobeId, body, randomUUID());
  assert.notEqual(first.historyId, second.historyId);
  assert.equal((await getClothing(wardrobeId, clothes[19])).wearCount, 2);
  assert.equal(
    (await getTemplate(wardrobeId, A)).revision,
    1,
    "stats preserve confirmation version",
  );
  const histories = await listHistories(wardrobeId, { from: date, to: date });
  assert.equal(
    histories.items.length,
    2,
    "history tab index returns two intentional same-day records",
  );
  await deleteHistory(wardrobeId, first.historyId);
  assert.equal((await getClothing(wardrobeId, clothes[0])).wearCount, 1);
  assert.deepEqual(ids(await getTemplateRecommendations(context, "auto")), [
    C,
    A,
    B,
  ]);
  await deleteHistory(wardrobeId, second.historyId);
  assert.equal((await getClothing(wardrobeId, clothes[19])).lastWornAt, 0);
  assert.deepEqual(ids(await getTemplateRecommendations(context, "auto")), [
    A,
    B,
    C,
  ]);
  await assert.rejects(
    createHistory(wardrobeId, body, operation),
    (e) => e.status === 409 && e.details.reason === "HISTORY_ALREADY_DELETED",
  );
  await getWeather(context);
  assert.equal(
    providerCalls,
    1,
    "recommendation refresh and record/delete never refresh same-day weather",
  );
  assert.equal(
    (await secondClient.get(`/wardrobes/${wardrobeId}/region`)).region.regionId,
    "abr:lg:131041",
  );
  assert.equal(
    (await secondClient.get(`/wardrobes/${wardrobeId}/region`)).mode,
    undefined,
  );

  // A new region receives a distinct cache; absent apparent temperature uses real-temperature fallback.
  apparent = null;
  temperature = 25;
  const fuchu = await searchRegions("東京都 府中");
  const nextRegion = await saveWardrobeRegion(wardrobeId, {
    regionId: fuchu.items[0].regionId,
    datasetVersion: fuchu.datasetVersion,
    expectedRevision: context.regionRevision,
  });
  context.regionRevision = nextRegion.revision;
  const fallback = await getTemplateRecommendations(context, "auto");
  assert.equal(fallback.basis, "temperature_max_fallback");
  assert.deepEqual(ids(fallback), [C]);
  assert.equal((await getWeather(context)).derivation.dressingIndex, null);
  assert.equal(providerCalls, 2);
  failForecast = true;
  const naha = await searchRegions("那覇");
  context.regionRevision = (
    await saveWardrobeRegion(wardrobeId, {
      regionId: naha.items[0].regionId,
      datasetVersion: naha.datasetVersion,
      expectedRevision: context.regionRevision,
    })
  ).revision;
  assert.equal(
    (await getTemplateRecommendations(context, "auto")).status,
    "weather_required",
  );
  const unavailableCalls = providerCalls;
  assert.equal(unavailableCalls, 3, "provider failure is not retried");
  assert.equal((await getWeather(context)).reason, "cooldown");
  assert.deepEqual(ids(await getTemplateRecommendations(context, "spring")), [
    A,
    C,
  ]);
  assert.equal(
    providerCalls,
    unavailableCalls,
    "cooldown and manual path do not retry provider",
  );
  await updateTemplate(wardrobeId, A, { name: "編集後" });
  const edited = await getTemplate(wardrobeId, A);
  assert.equal(edited.revision, 2);
  await assert.rejects(
    createHistory(wardrobeId, body, randomUUID()),
    (e) => e.status === 409 && e.details.reason === "CONFIRMATION_STALE",
  );
  await updateClothing(wardrobeId, clothes[20], {
    imageKey: "clothing/updated.png",
  });
  assert.equal(
    (await getTemplateRecommendations(context, "summer")).items[0]
      .clothingItems[0].imageKey,
    "clothing/updated.png",
  );
  await deleteClothing(wardrobeId, clothes[0]);
  assert.deepEqual(ids(await getTemplateRecommendations(context, "spring")), [
    C,
  ]);
  assert.equal(
    (await listHistories(wardrobeId, { from: date, to: date })).items.length,
    0,
  );
  // Seed only provider accounting: the production service still performs its
  // strongly consistent read and conditional reservation against DynamoDB Local.
  const usageKey = { PK: "PROVIDER#OPEN_METEO", SK: "USAGE" };
  const seedUsage = async (dayCount, revision) => {
    const utc = new Date().toISOString();
    await document.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...usageKey,
          revision,
          gateUntil: 0,
          seconds: {},
          minutes: {},
          hours: {},
          days: {},
          utcDay: utc.slice(0, 10),
          dayCount,
          utcMonth: utc.slice(0, 7),
          monthCount: dayCount,
        },
      }),
    );
  };
  const changeRegion = async (query) => {
    const found = await searchRegions(query);
    assert.ok(found.items.length > 0);
    context.regionRevision = (
      await saveWardrobeRegion(wardrobeId, {
        regionId: found.items[0].regionId,
        datasetVersion: found.datasetVersion,
        expectedRevision: context.regionRevision,
      })
    ).revision;
  };
  const warnings = [];
  console.warn = (message) => warnings.push(JSON.parse(message));
  failForecast = false;
  apparent = 20;
  temperature = 27;
  await seedUsage(3999, 100);
  await changeRegion("札幌市");
  assert.equal((await getWeather(context)).status, "available");
  assert.equal(providerCalls, 4);
  assert.deepEqual(warnings, [
    { event: "weather_provider_usage_80_percent", provider: "open-meteo" },
  ]);
  const reserved = (
    await document.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: usageKey,
        ConsistentRead: true,
      }),
    )
  ).Item;
  assert.equal(reserved.dayCount, 4000);
  assert.equal(reserved.revision, 101);
  await seedUsage(5000, 200);
  await changeRegion("大阪市");
  const exhausted = await getWeather(context);
  assert.equal(exhausted.status, "unavailable");
  assert.equal(exhausted.reason, "budget_exhausted");
  assert.equal(
    providerCalls,
    4,
    "100% usage prevents new-region provider transmission",
  );
  assert.deepEqual(ids(await getTemplateRecommendations(context, "summer")), [
    C,
  ]);
  await changeRegion("新宿区");
  assert.equal(
    (await getWeather(context)).status,
    "available",
    "cached weather remains usable at 100% usage",
  );
  assert.equal(providerCalls, 4);
  assert.equal(warnings.length, 1);
  console.log(
    `PASS real Web endpoints -> HTTP API -> DynamoDB Local: ${calls.length} requests; 20-clothing confirmation, shared-clothing rank/update/delete, same-day intents/replay, two-client region, weather cache/fallback/cooldown/manual, history GSI, images/revisions, provider quota 80% warning/100% blocking/cache`,
  );
} finally {
  globalThis.fetch = nativeFetch;
  console.warn = nativeWarn;
  if (server) await new Promise((resolve) => server.close(resolve));
  await dynamo.send(
    new DeleteTableCommand({ TableName: process.env.TABLE_NAME }),
  );
  dynamo.destroy();
}
