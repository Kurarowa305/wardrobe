import assert from "node:assert/strict";
import dynalite from "dynalite";
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createWeatherRepository } from "../src/domains/weather/repository.ts";
import { createWeatherService } from "../src/domains/weather/service.ts";
import { reserveUsage } from "../src/domains/weather/usage.ts";
const server = dynalite({ createTableMs: 0 });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
process.env.DDB_ENDPOINT = `http://127.0.0.1:${server.address().port}`;
process.env.TABLE_NAME = "WeatherTest";
const client = new DynamoDBClient({
  endpoint: process.env.DDB_ENDPOINT,
  region: "ap-northeast-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
  maxAttempts: 1,
});
const document = DynamoDBDocumentClient.from(client);
const signal = new AbortController().signal;
try {
  await client.send(
    new CreateTableCommand({
      TableName: process.env.TABLE_NAME,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    }),
  );
  const region = {
    regionId: "abr:lg:131041",
    latitude: 35.69,
    longitude: 139.7,
  };
  await document.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: { PK: "W#wd_test", SK: "META", regionRevision: 1, region },
    }),
  );
  const repository = createWeatherRepository();
  let now = Date.parse("2026-10-11T01:00:00Z"),
    requests = 0;
  const fixture = {
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
      apparent_temperature_max: [20],
      temperature_2m_max: [22],
      temperature_2m_min: [5],
      weather_code: [3],
    },
  };
  const service = createWeatherService({
    repository,
    now: () => now,
    fetch: async () => {
      requests++;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return new Response(JSON.stringify(fixture));
    },
  });
  const results = await Promise.all(
    Array.from({ length: 6 }, () =>
      service.get({
        wardrobeId: "wd_test",
        date: "2026-10-11",
        regionRevision: 1,
      }),
    ),
  );
  assert.ok(
    results.every((result) => result.status === "available"),
    JSON.stringify(results),
  );
  assert.equal(requests, 1);
  assert.equal((await repository.readUsage(signal)).dayCount, 1);
  // Lease ownership must fence stale completion even after a subsequent owner acquires.
  assert.equal(
    await repository.acquire("fencing", "old", now + 100, now, signal),
    true,
  );
  now += 101;
  assert.equal(
    await repository.acquire("fencing", "new", now + 100, now, signal),
    true,
  );
  assert.equal(
    await repository.finish(
      "fencing",
      "old",
      now,
      { cooldownUntil: now + 300000 },
      signal,
    ),
    false,
  );
  assert.equal(
    await repository.finish(
      "fencing",
      "new",
      now,
      { cooldownUntil: now + 300000 },
      signal,
    ),
    true,
  );
  // A gate extends atomically; stale reservations cannot restore old gate/counters.
  const previous = await repository.readUsage(signal),
    reservation = reserveUsage(previous, now);
  await repository.gate(now + 300000, signal);
  await repository.gate(now + 1000, signal);
  assert.equal(
    await repository.reserve(previous, reservation.usage, signal),
    false,
  );
  assert.equal((await repository.readUsage(signal)).gateUntil, now + 300000);
  assert.equal(
    (
      await service.get({
        wardrobeId: "wd_test",
        date: "2026-10-11",
        regionRevision: 1,
      })
    ).delivery,
    "cache",
  );
  assert.equal(requests, 1);
  // Each scenario uses a fresh location, while every service instance shares provider state.
  await document.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: "PROVIDER#OPEN_METEO",
        SK: "USAGE",
        ...reserveUsage(null, now).usage,
      },
    }),
  );
  const saveRegion = async (id) =>
    document.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          PK: `W#${id}`,
          SK: "META",
          regionRevision: 1,
          region: { ...region, regionId: id },
        },
      }),
    );
  await saveRegion("wd_failure");
  let failedCalls = 0;
  const failure = createWeatherService({
    repository,
    now: () => now,
    fetch: async () => {
      failedCalls++;
      throw new Error("network failed");
    },
  });
  assert.equal(
    (
      await failure.get({
        wardrobeId: "wd_failure",
        date: "2026-10-11",
        regionRevision: 1,
      })
    ).reason,
    "fetch_failed",
  );
  assert.equal(
    (
      await failure.get({
        wardrobeId: "wd_failure",
        date: "2026-10-11",
        regionRevision: 1,
      })
    ).reason,
    "cooldown",
  );
  assert.equal(failedCalls, 1);
  await saveRegion("wd_429");
  await saveRegion("wd_other");
  let throttledCalls = 0;
  const throttled = createWeatherService({
    repository,
    now: () => now,
    fetch: async () => {
      throttledCalls++;
      return new Response("", {
        status: 429,
        headers: { "retry-after": "600" },
      });
    },
  });
  const limited = await throttled.get({
    wardrobeId: "wd_429",
    date: "2026-10-11",
    regionRevision: 1,
  });
  assert.equal(limited.reason, "rate_limited");
  assert.equal(limited.retryAfter, new Date(now + 600000).toISOString());
  assert.equal(
    (
      await throttled.get({
        wardrobeId: "wd_other",
        date: "2026-10-11",
        regionRevision: 1,
      })
    ).reason,
    "rate_limited",
  );
  assert.equal(throttledCalls, 1);
  // Current-day data remains usable with provider gate or unavailable usage storage.
  const cacheOnly = createWeatherService({
    repository: {
      ...repository,
      readUsage: async () => {
        throw new Error("offline");
      },
    },
    now: () => now,
    fetch: async () => {
      throw new Error("must not fetch");
    },
  });
  assert.equal(
    (
      await cacheOnly.get({
        wardrobeId: "wd_test",
        date: "2026-10-11",
        regionRevision: 1,
      })
    ).status,
    "available",
  );
  // A response must reject a region change that occurred while the forecast was in flight.
  await document.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: "PROVIDER#OPEN_METEO",
        SK: "USAGE",
        ...reserveUsage(null, now).usage,
      },
    }),
  );
  await saveRegion("wd_changed");
  const changed = createWeatherService({
    repository,
    now: () => now,
    fetch: async () => {
      await document.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME,
          Item: {
            PK: "W#wd_changed",
            SK: "META",
            regionRevision: 2,
            region: null,
          },
        }),
      );
      return new Response(JSON.stringify(fixture));
    },
  });
  await assert.rejects(
    changed.get({
      wardrobeId: "wd_changed",
      date: "2026-10-11",
      regionRevision: 1,
    }),
    (error) => error.details.reason === "REGION_CHANGED",
  );
  console.log(
    "weather DynamoDB: concurrency, lease fencing, gate/CAS, cooldown, shared 429, stale context passed",
  );
} finally {
  client.destroy();
  await new Promise((resolve) => server.close(resolve));
}
