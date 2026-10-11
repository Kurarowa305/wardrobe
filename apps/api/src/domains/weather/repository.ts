import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDynamoDbClientConfig } from "../../clients/dynamodb.js";
import { createAppError } from "../../core/errors/index.js";
import type { Forecast, WeatherRegion, WeatherReason } from "./forecast.js";
import type { ProviderUsage } from "./usage.js";
export type RegionContext = { revision: number; region: WeatherRegion | null };
export type StoredForecast = Forecast & {
  fetchedAt: string;
  expiresAt: string;
};
export type WeatherState = {
  forecast?: StoredForecast;
  expiresAt?: number;
  cooldownUntil?: number;
  leaseOwner?: string;
  leaseUntil?: number;
  reason?: WeatherReason;
};
export type WeatherRepository = {
  readContext(id: string, signal: AbortSignal): Promise<RegionContext | null>;
  readState(key: string, signal: AbortSignal): Promise<WeatherState | null>;
  acquire(
    key: string,
    owner: string,
    until: number,
    now: number,
    signal: AbortSignal,
  ): Promise<boolean>;
  finish(
    key: string,
    owner: string,
    now: number,
    result: WeatherState,
    signal: AbortSignal,
  ): Promise<boolean>;
  readUsage(signal: AbortSignal): Promise<ProviderUsage | null>;
  reserve(
    previous: ProviderUsage | null,
    next: ProviderUsage,
    signal: AbortSignal,
  ): Promise<boolean>;
  gate(until: number, signal: AbortSignal): Promise<void>;
};
const conditional = (error: unknown) =>
  error instanceof Error && error.name === "ConditionalCheckFailedException";
export function createWeatherRepository(): WeatherRepository {
  const config = createDynamoDbClientConfig();
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: config.region,
      maxAttempts: 1,
      ...(config.endpoint
        ? {
            endpoint: config.endpoint,
            credentials: { accessKeyId: "local", secretAccessKey: "local" },
          }
        : {}),
    }),
    { marshallOptions: { removeUndefinedValues: true } },
  );
  const provider = { PK: "PROVIDER#OPEN_METEO", SK: "USAGE" };
  const stateKey = (key: string) => ({ PK: `WEATHER#${key}`, SK: "STATE" });
  const get = async (Key: Record<string, string>, signal: AbortSignal) =>
    (
      await client.send(
        new GetCommand({
          TableName: config.tableName,
          Key,
          ConsistentRead: true,
        }),
        { abortSignal: signal },
      )
    ).Item;
  const update = async (
    input: Omit<ConstructorParameters<typeof UpdateCommand>[0], "TableName">,
    signal: AbortSignal,
  ): Promise<boolean> => {
    try {
      await client.send(
        new UpdateCommand({ TableName: config.tableName, ...input }),
        { abortSignal: signal },
      );
      return true;
    } catch (error) {
      if (conditional(error)) return false;
      throw error;
    }
  };
  return {
    async readContext(id, signal) {
      const item = await get({ PK: `W#${id}`, SK: "META" }, signal);
      if (!item) return null;
      const region = item.region ?? null;
      if (
        region &&
        (typeof region.regionId !== "string" ||
          typeof region.latitude !== "number" ||
          !Number.isFinite(region.latitude) ||
          typeof region.longitude !== "number" ||
          !Number.isFinite(region.longitude))
      )
        throw createAppError("SERVICE_UNAVAILABLE", {
          details: { reason: "INVALID_REGION" },
        });
      return { revision: item.regionRevision ?? 0, region };
    },
    async readState(key, signal) {
      return (
        ((await get(stateKey(key), signal)) as WeatherState | undefined) ?? null
      );
    },
    async acquire(key, owner, until, now, signal) {
      return update(
        {
          Key: stateKey(key),
          UpdateExpression:
            "SET leaseOwner = :owner, leaseUntil = :until, #ttl = :ttl",
          ConditionExpression:
            "(attribute_not_exists(leaseUntil) OR leaseUntil <= :now) AND (attribute_not_exists(expiresAt) OR expiresAt <= :now) AND (attribute_not_exists(cooldownUntil) OR cooldownUntil <= :now)",
          ExpressionAttributeNames: { "#ttl": "ttl" },
          ExpressionAttributeValues: {
            ":owner": owner,
            ":until": until,
            ":now": now,
            ":ttl": Math.ceil((until + 300000) / 1000),
          },
        },
        signal,
      );
    },
    async finish(key, owner, now, result, signal) {
      const names: Record<string, string> = { "#ttl": "ttl" },
        values: Record<string, unknown> = {
          ":owner": owner,
          ":now": now,
          ":zero": 0,
        };
      const assignments = Object.entries(result)
        .filter(([, v]) => v !== undefined)
        .map(([key, value], i) => {
          names[`#v${i}`] = key;
          values[`:v${i}`] = value;
          return `#v${i} = :v${i}`;
        });
      values[":ttl"] = Math.ceil(
        Math.max(
          result.expiresAt ?? 0,
          result.cooldownUntil ?? 0,
          now + 300000,
        ) / 1000,
      );
      return update(
        {
          Key: stateKey(key),
          UpdateExpression: `SET ${assignments.join(", ")}, leaseUntil = :zero, #ttl = :ttl`,
          ConditionExpression: "leaseOwner = :owner AND leaseUntil > :now",
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        },
        signal,
      );
    },
    async readUsage(signal) {
      return (
        ((await get(provider, signal)) as ProviderUsage | undefined) ?? null
      );
    },
    async reserve(previous, next, signal) {
      return update(
        {
          Key: provider,
          UpdateExpression:
            "SET revision = :next, gateUntil = :gate, seconds = :seconds, minutes = :minutes, hours = :hours, days = :days, utcDay = :day, dayCount = :dayCount, utcMonth = :month, monthCount = :monthCount",
          ConditionExpression: previous
            ? "revision = :previous"
            : "attribute_not_exists(revision)",
          ExpressionAttributeValues: {
            ":next": next.revision,
            ":gate": next.gateUntil,
            ":seconds": next.seconds,
            ":minutes": next.minutes,
            ":hours": next.hours,
            ":days": next.days,
            ":day": next.utcDay,
            ":dayCount": next.dayCount,
            ":month": next.utcMonth,
            ":monthCount": next.monthCount,
            ...(previous ? { ":previous": previous.revision } : {}),
          },
        },
        signal,
      );
    },
    async gate(until, signal) {
      await update(
        {
          Key: provider,
          UpdateExpression: "SET gateUntil = :until ADD revision :one",
          ConditionExpression:
            "attribute_not_exists(gateUntil) OR gateUntil < :until",
          ExpressionAttributeValues: { ":until": until, ":one": 1 },
        },
        signal,
      );
    },
  };
}
