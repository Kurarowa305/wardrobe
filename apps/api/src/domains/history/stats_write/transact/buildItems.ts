import type { TransactWriteItem } from "../../../../clients/dynamodb.js";
import { buildClothingBaseKey } from "../../../clothing/repo/clothingKeys.js";
import { buildTemplateBaseKey } from "../../../template/repo/templateKeys.js";
import { buildWearDailyKey } from "../keys.js";
import type { DailyStatsCacheUpdateFact } from "../aggregations/daily.js";
import type { WearDailyFact } from "../types.js";

export type BuildHistoryStatsWriteItemsInput = {
  wearDailyFacts: WearDailyFact[];
  cacheUpdateFacts: DailyStatsCacheUpdateFact[];
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
  resolveRecomputedLastWornAt?: ((fact: DailyStatsCacheUpdateFact) => number) | undefined,
): TransactWriteItem => {
  const nextLastWornAt = fact.lastWornAt.mode === "max"
    ? fact.lastWornAt.epochMs
    : resolveRecomputedLastWornAt?.(fact);

  if (nextLastWornAt === undefined) {
    throw new Error("lastWornAt recompute result is required for delete cache update");
  }

  return {
    Update: {
      Key: buildStatsTargetBaseKey(fact),
      UpdateExpression:
        "SET wearCount = if_not_exists(wearCount, :zero) + :wearCountDelta, lastWornAt = :lastWornAt",
      ConditionExpression: fact.wearCountDelta < 0
        ? "attribute_exists(PK) AND wearCount >= :requiredWearCount"
        : "attribute_exists(PK)",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":wearCountDelta": fact.wearCountDelta,
        ":lastWornAt": nextLastWornAt,
        ...(fact.wearCountDelta < 0 ? { ":requiredWearCount": Math.abs(fact.wearCountDelta) } : {}),
      },
    },
  };
};

export const buildHistoryStatsWriteItems = (
  input: BuildHistoryStatsWriteItemsInput,
): TransactWriteItem[] => {
  const wearDailyItems = input.wearDailyFacts.map(buildWearDailyUpdateItem);
  const cacheItems = input.cacheUpdateFacts.map((fact) => buildCacheUpdateItem(fact, input.resolveRecomputedLastWornAt));

  return [...wearDailyItems, ...cacheItems];
};
