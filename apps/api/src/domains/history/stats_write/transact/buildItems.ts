import type { TransactWriteItem } from "../../../../clients/dynamodb.js";
import { buildClothingBaseKey, buildClothingLastWornAtSk, buildClothingWearCountSk } from "../../../clothing/repo/clothingKeys.js";
import { buildTemplateBaseKey, buildTemplateLastWornAtSk, buildTemplateWearCountSk } from "../../../template/repo/templateKeys.js";
import { buildWearDailyKey } from "../keys.js";
import type { DailyStatsCacheUpdateFact } from "../aggregations/daily.js";
import type { WearDailyFact } from "../types.js";

export type StatsCacheSnapshot = {
  wearCount: number;
  lastWornAt: number;
};

export type BuildHistoryStatsWriteItemsInput = {
  wearDailyFacts: WearDailyFact[];
  cacheUpdateFacts: DailyStatsCacheUpdateFact[];
  resolveCurrentStats?: ((fact: DailyStatsCacheUpdateFact) => StatsCacheSnapshot | undefined) | undefined;
  resolveRecomputedLastWornAt?: ((fact: DailyStatsCacheUpdateFact) => number) | undefined;
};

const buildStatsTargetBaseKey = (fact: DailyStatsCacheUpdateFact) => {
  if (fact.target.kind === "clothing") {
    return buildClothingBaseKey({
      wardrobeId: fact.wardrobeId,
      clothingId: fact.target.id,
    });
  }

  return buildTemplateBaseKey({
    wardrobeId: fact.wardrobeId,
    templateId: fact.target.id,
  });
};

const buildStatsTargetWearCountSk = (fact: DailyStatsCacheUpdateFact, wearCount: number) => {
  if (fact.target.kind === "clothing") {
    return buildClothingWearCountSk({
      clothingId: fact.target.id,
      value: wearCount,
    });
  }

  return buildTemplateWearCountSk({
    templateId: fact.target.id,
    value: wearCount,
  });
};

const buildStatsTargetLastWornAtSk = (fact: DailyStatsCacheUpdateFact, lastWornAt: number) => {
  if (fact.target.kind === "clothing") {
    return buildClothingLastWornAtSk({
      clothingId: fact.target.id,
      value: lastWornAt,
    });
  }

  return buildTemplateLastWornAtSk({
    templateId: fact.target.id,
    value: lastWornAt,
  });
};

const buildWearDailyUpdateItem = (fact: WearDailyFact): TransactWriteItem => ({
  Update: {
    Key: buildWearDailyKey({
      wardrobeId: fact.wardrobeId,
      target: fact.target,
      date: fact.date,
    }),
    UpdateExpression: "SET #count = if_not_exists(#count, :zero) + :countDelta",
    ...(fact.count < 0
      ? { ConditionExpression: "attribute_exists(#count) AND #count >= :requiredCount" }
      : {}),
    ExpressionAttributeNames: {
      "#count": "count",
    },
    ExpressionAttributeValues: {
      ":zero": 0,
      ":countDelta": fact.count,
      ...(fact.count < 0 ? { ":requiredCount": Math.abs(fact.count) } : {}),
    },
  },
});

const buildCacheUpdateItem = (
  fact: DailyStatsCacheUpdateFact,
  resolveCurrentStats?: ((fact: DailyStatsCacheUpdateFact) => StatsCacheSnapshot | undefined) | undefined,
  resolveRecomputedLastWornAt?: ((fact: DailyStatsCacheUpdateFact) => number) | undefined,
): TransactWriteItem => {
  const currentStats = resolveCurrentStats?.(fact);
  if (currentStats === undefined) {
    throw new Error("current stats is required for cache update");
  }

  const nextWearCount = currentStats.wearCount + fact.wearCountDelta;
  if (nextWearCount < 0) {
    throw new Error("wearCount cache update result must not be negative");
  }

  const nextLastWornAt = fact.lastWornAt.mode === "max"
    ? Math.max(currentStats.lastWornAt, fact.lastWornAt.epochMs)
    : resolveRecomputedLastWornAt?.(fact);

  if (nextLastWornAt === undefined) {
    throw new Error("lastWornAt recompute result is required for delete cache update");
  }

  const nextWearCountSk = buildStatsTargetWearCountSk(fact, nextWearCount);
  const nextLastWornAtSk = buildStatsTargetLastWornAtSk(fact, nextLastWornAt);

  return {
    Update: {
      Key: buildStatsTargetBaseKey(fact),
      UpdateExpression:
        "SET wearCount = :wearCount, lastWornAt = :lastWornAt, wearCountSk = :wearCountSk, lastWornAtSk = :lastWornAtSk",
      ConditionExpression: fact.wearCountDelta < 0
        ? "attribute_exists(PK) AND (attribute_not_exists(wearCount) OR wearCount = :currentWearCount) AND wearCount >= :requiredWearCount"
        : "attribute_exists(PK) AND (attribute_not_exists(wearCount) OR wearCount = :currentWearCount)",
      ExpressionAttributeValues: {
        ":currentWearCount": currentStats.wearCount,
        ":wearCount": nextWearCount,
        ":lastWornAt": nextLastWornAt,
        ":wearCountSk": nextWearCountSk,
        ":lastWornAtSk": nextLastWornAtSk,
        ...(fact.wearCountDelta < 0 ? { ":requiredWearCount": Math.abs(fact.wearCountDelta) } : {}),
      },
    },
  };
};

export const buildHistoryStatsWriteItems = (
  input: BuildHistoryStatsWriteItemsInput,
): TransactWriteItem[] => {
  const wearDailyItems = input.wearDailyFacts.map(buildWearDailyUpdateItem);
  const cacheItems = input.cacheUpdateFacts.map((fact) =>
    buildCacheUpdateItem(fact, input.resolveCurrentStats, input.resolveRecomputedLastWornAt)
  );

  return [...wearDailyItems, ...cacheItems];
};
