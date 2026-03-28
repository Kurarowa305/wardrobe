import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createClothingBatchGetRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import { createTemplateRepo } from "../../template/repo/templateRepo.js";
import { buildHistoryBaseKey } from "../repo/historyKeys.js";
import { createHistoryRepo, type HistoryItem } from "../repo/historyRepo.js";
import { buildDailyStatsCacheUpdateFacts, buildWearDailyFacts } from "../stats_write/aggregations/daily.js";
import { buildHistoryStatsWriteItems } from "../stats_write/transact/buildItems.js";
import { assertHistoryStatsWriteItemsWithinLimit } from "../stats_write/transact/guard.js";
import type { DailyStatsCacheUpdateFact } from "../stats_write/aggregations/daily.js";
import type { HistoryStatsWriteCommand, StatsWriteTargetFact } from "../stats_write/types.js";
import { buildWearDailyKey } from "../stats_write/keys.js";
import { createWearDailyQueryRepo, type WearDailyLatestBeforeDateResult } from "../stats_write/repo/wearDailyQueryRepo.js";
import { recomputeLastWornAt } from "../stats_write/recompute/lastWornAt.js";

type HistoryDeleteSource = Pick<HistoryItem, "wardrobeId" | "historyId" | "date" | "templateId" | "clothingIds" | "createdAt">;

type TargetStats = {
  wearCount: number;
  lastWornAt: number;
};

export type DeleteHistoryWithStatsWriteInput = {
  wardrobeId: string;
  historyId: string;
};

export type DeleteHistoryWithStatsWriteDependencies = {
  getHistory?: ((input: { wardrobeId: string; historyId: string }) => Promise<unknown>) | undefined;
  getTemplate?: ((input: { wardrobeId: string; templateId: string }) => Promise<unknown>) | undefined;
  batchGetClothingByIds?: ((input: { wardrobeId: string; clothingIds: string[] }) => Promise<unknown[]>) | undefined;
  findLatestBeforeDate?: ((input: {
    wardrobeId: string;
    target: StatsWriteTargetFact;
    beforeDate: string;
  }) => Promise<WearDailyLatestBeforeDateResult>) | undefined;
  getWearDailyCount?: ((input: {
    wardrobeId: string;
    target: StatsWriteTargetFact;
    date: string;
  }) => Promise<number | null>) | undefined;
  transactWriteItems?: ((items: TransactWriteItem[]) => Promise<unknown>) | undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const isHistoryItem = (value: unknown): value is HistoryDeleteSource => {
  return isRecord(value)
    && typeof value.wardrobeId === "string"
    && typeof value.historyId === "string"
    && typeof value.date === "string"
    && (value.templateId === null || typeof value.templateId === "string")
    && Array.isArray(value.clothingIds)
    && value.clothingIds.every((clothingId) => typeof clothingId === "string")
    && typeof value.createdAt === "number";
};

const extractGetItem = (result: unknown): unknown => {
  if (!isRecord(result)) {
    return undefined;
  }

  return result.Item ?? result.item;
};

const toHistorySourceOrThrow = (result: unknown, input: DeleteHistoryWithStatsWriteInput): HistoryDeleteSource => {
  const item = extractGetItem(result);
  if (!isHistoryItem(item)) {
    throw createAppError("NOT_FOUND", {
      message: "History was not found.",
      details: {
        resource: "history",
        wardrobeId: input.wardrobeId,
        historyId: input.historyId,
      },
    });
  }

  return item;
};

const extractTemplateStats = (result: unknown): TargetStats | null => {
  const item = extractGetItem(result);
  if (!isRecord(item)) {
    return null;
  }

  if (typeof item.wearCount !== "number" || typeof item.lastWornAt !== "number") {
    return null;
  }

  return {
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
  };
};


const extractBatchClothingMap = (results: unknown[]): Map<string, TargetStats> => {
  const resolvedItems = results.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const responses = entry.Responses;
    if (!isRecord(responses)) {
      return [];
    }

    return Object.values(responses).flatMap((response) => {
      return Array.isArray(response) ? response : [];
    });
  });

  const clothingEntries = resolvedItems.flatMap((item) => {
    if (!isRecord(item) || typeof item.clothingId !== "string") {
      return [];
    }

    if (typeof item.wearCount !== "number" || typeof item.lastWornAt !== "number") {
      return [];
    }

    return [[item.clothingId, { wearCount: item.wearCount, lastWornAt: item.lastWornAt }] as const];
  });

  return new Map(clothingEntries);
};

const shouldDeleteDailyCounter = (currentCount: number): boolean => {
  return currentCount <= 1;
};

const extractWearDailyCount = (result: unknown): number | null => {
  const item = extractGetItem(result);
  if (!isRecord(item) || typeof item.count !== "number") {
    return null;
  }

  return item.count;
};

const resolveNextLastWornAtByTarget = async (input: {
  wardrobeId: string;
  deletedDate: string;
  cacheFacts: DailyStatsCacheUpdateFact[];
  targetStatsMap: Map<string, TargetStats>;
  findLatestBeforeDate: DeleteHistoryWithStatsWriteDependencies["findLatestBeforeDate"];
}): Promise<Map<string, number>> => {
  const result = new Map<string, number>();

  for (const fact of input.cacheFacts) {
    const key = `${fact.target.kind}:${fact.target.id}`;
    const stats = input.targetStatsMap.get(key);

    if (!stats || !input.findLatestBeforeDate) {
      result.set(key, 0);
      continue;
    }

    const nextLastWornAt = await recomputeLastWornAt({
      wardrobeId: input.wardrobeId,
      target: fact.target,
      deletedDate: input.deletedDate,
      currentLastWornAt: stats.lastWornAt,
      findLatestBeforeDate: input.findLatestBeforeDate,
    });

    result.set(key, nextLastWornAt);
  }

  return result;
};

const buildDailyDeleteOrDecrementItem = (input: {
  wardrobeId: string;
  target: StatsWriteTargetFact;
  date: string;
  currentCount: number;
}): TransactWriteItem => {
  const key = buildWearDailyKey({
    wardrobeId: input.wardrobeId,
    target: input.target,
    date: input.date,
  });

  if (shouldDeleteDailyCounter(input.currentCount)) {
    return {
      Delete: {
        Key: key,
        ConditionExpression: "attribute_exists(PK)",
      },
    };
  }

  return {
    Update: {
      Key: key,
      UpdateExpression: "SET #count = #count - :one",
      ConditionExpression: "attribute_exists(PK) AND #count >= :one",
      ExpressionAttributeNames: {
        "#count": "count",
      },
      ExpressionAttributeValues: {
        ":one": 1,
      },
    },
  };
};

export function createDeleteHistoryWithStatsWriteUsecase(
  dependencies: DeleteHistoryWithStatsWriteDependencies = {},
) {
  const historyRepo = createHistoryRepo();
  const templateRepo = createTemplateRepo();
  const clothingBatchGetRepo = createClothingBatchGetRepo();
  const wearDailyQueryRepo = createWearDailyQueryRepo();

  const getHistory = dependencies.getHistory
    ?? ((input: { wardrobeId: string; historyId: string }) => historyRepo.get(input));
  const getTemplate = dependencies.getTemplate
    ?? ((input: { wardrobeId: string; templateId: string }) => templateRepo.get(input));
  const batchGetClothingByIds = dependencies.batchGetClothingByIds
    ?? ((input: { wardrobeId: string; clothingIds: string[] }) => clothingBatchGetRepo.batchGetByIds(input));
  const findLatestBeforeDate = dependencies.findLatestBeforeDate
    ?? ((input: { wardrobeId: string; target: StatsWriteTargetFact; beforeDate: string }) =>
      wearDailyQueryRepo.findLatestBeforeDate(input));
  const getWearDailyCount = dependencies.getWearDailyCount
    ?? (async (input: { wardrobeId: string; target: StatsWriteTargetFact; date: string }) => {
      const daily = await createDynamoDbClient().getItem({
        Key: buildWearDailyKey(input),
        ConsistentRead: true,
      });

      return extractWearDailyCount(daily);
    });
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));

  return {
    async delete(input: DeleteHistoryWithStatsWriteInput): Promise<void> {
      const history = toHistorySourceOrThrow(await getHistory(input), input);

      const command: HistoryStatsWriteCommand = {
        mode: "delete",
        history,
      };

      const wearDailyFacts = buildWearDailyFacts(command);
      const cacheFacts = buildDailyStatsCacheUpdateFacts(command);

      const templateStatsResult = history.templateId
        ? await getTemplate({ wardrobeId: input.wardrobeId, templateId: history.templateId })
        : null;
      const clothingStatsResults = history.clothingIds.length > 0
        ? await batchGetClothingByIds({ wardrobeId: input.wardrobeId, clothingIds: [...new Set(history.clothingIds)] })
        : [];

      const targetStatsMap = new Map<string, TargetStats>();
      if (history.templateId) {
        const templateStats = extractTemplateStats(templateStatsResult);
        if (!templateStats) {
          throw createAppError("NOT_FOUND", {
            message: "Template was not found.",
            details: {
              resource: "template",
              wardrobeId: input.wardrobeId,
              templateId: history.templateId,
            },
          });
        }

        targetStatsMap.set(`template:${history.templateId}`, templateStats);
      }

      const clothingStatsMap = extractBatchClothingMap(clothingStatsResults);
      for (const clothingId of [...new Set(history.clothingIds)]) {
        const stats = clothingStatsMap.get(clothingId);
        if (!stats) {
          throw createAppError("NOT_FOUND", {
            message: "Clothing was not found.",
            details: {
              resource: "clothing",
              wardrobeId: input.wardrobeId,
              clothingId,
            },
          });
        }

        targetStatsMap.set(`clothing:${clothingId}`, stats);
      }

      const nextLastWornAtByTarget = await resolveNextLastWornAtByTarget({
        wardrobeId: input.wardrobeId,
        deletedDate: history.date,
        cacheFacts,
        targetStatsMap,
        findLatestBeforeDate,
      });
      const dailyCounts = new Map<string, number>();
      for (const fact of wearDailyFacts) {
        const key = `${fact.target.kind}:${fact.target.id}`;
        const count = await getWearDailyCount({
          wardrobeId: fact.wardrobeId,
          target: fact.target,
          date: fact.date,
        });
        dailyCounts.set(key, count ?? 0);
      }

      const deleteAndStatsItems: TransactWriteItem[] = [
        {
          Delete: {
            Key: buildHistoryBaseKey({
              wardrobeId: history.wardrobeId,
              historyId: history.historyId,
            }),
            ConditionExpression: "attribute_exists(PK)",
          },
        },
        ...wearDailyFacts.map((fact) => {
          const key = `${fact.target.kind}:${fact.target.id}`;
          const currentCount = dailyCounts.get(key) ?? 0;

          return buildDailyDeleteOrDecrementItem({
            wardrobeId: fact.wardrobeId,
            target: fact.target,
            date: fact.date,
            currentCount,
          });
        }),
        ...buildHistoryStatsWriteItems({
          wearDailyFacts: [],
          cacheUpdateFacts: cacheFacts,
          resolveRecomputedLastWornAt: (fact) => {
            const key = `${fact.target.kind}:${fact.target.id}`;
            return nextLastWornAtByTarget.get(key) ?? 0;
          },
        }),
      ];

      assertHistoryStatsWriteItemsWithinLimit(deleteAndStatsItems);
      await transactWriteItems(deleteAndStatsItems);
    },
  };
}

export const deleteHistoryWithStatsWrite = createDeleteHistoryWithStatsWriteUsecase;
