import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createClothingBatchGetRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import { createTemplateRepo } from "../../template/repo/templateRepo.js";
import { createHistoryEntity } from "../entities/history.js";
import { buildHistoryItem } from "../repo/historyRepo.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { buildDailyStatsCacheUpdateFacts, buildWearDailyFacts } from "../stats_write/aggregations/daily.js";
import { buildHistoryStatsWriteItems } from "../stats_write/transact/buildItems.js";
import { assertHistoryStatsWriteItemsWithinLimit } from "../stats_write/transact/guard.js";
import type { DailyStatsCacheUpdateFact } from "../stats_write/aggregations/daily.js";
import type { HistoryStatsWriteCommand } from "../stats_write/types.js";

type TargetStats = {
  wearCount: number;
  lastWornAt: number;
};

type CreateHistorySource = {
  templateId: string | null;
  clothingIds: string[];
  templateStats: TargetStats | null;
};

export type CreateHistoryWithStatsWriteInput = {
  wardrobeId: string;
  date: string;
  templateId?: string | undefined;
  clothingIds?: string[] | undefined;
};

export type CreateHistoryWithStatsWriteOutput = {
  historyId: string;
};

export type CreateHistoryWithStatsWriteDependencies = {
  now?: (() => number) | undefined;
  generateHistoryId?: (() => string) | undefined;
  transactWriteItems?: ((items: TransactWriteItem[]) => Promise<unknown>) | undefined;
  getTemplate?: ((input: { wardrobeId: string; templateId: string }) => Promise<unknown>) | undefined;
  batchGetClothingByIds?: ((input: { wardrobeId: string; clothingIds: string[] }) => Promise<unknown[]>) | undefined;
};

const unique = (values: string[]): string[] => [...new Set(values)];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const extractGetItem = (result: unknown): unknown => {
  if (!isRecord(result)) {
    return undefined;
  }

  return result.Item ?? result.item;
};

const extractTargetStats = (item: unknown): TargetStats | null => {
  if (!isRecord(item)) {
    return null;
  }

  return {
    wearCount: typeof item.wearCount === "number" ? item.wearCount : 0,
    lastWornAt: typeof item.lastWornAt === "number" ? item.lastWornAt : 0,
  };
};

function extractTemplateClothingIds(
  result: unknown,
  input: { wardrobeId: string; templateId: string },
): string[] {
  const candidate = extractGetItem(result);

  if (candidate === undefined || candidate === null) {
    throw createAppError("NOT_FOUND", {
      message: "Template was not found.",
      details: {
        resource: "template",
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    });
  }

  if (!isRecord(candidate) || !Array.isArray(candidate.clothingIds) || candidate.clothingIds.length === 0) {
    throw createAppError("INTERNAL_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        resource: "template",
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    });
  }

  if (!candidate.clothingIds.every((clothingId) => typeof clothingId === "string")) {
    throw createAppError("INTERNAL_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        resource: "template",
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    });
  }

  const clothingIds = candidate.clothingIds;
  if (unique(clothingIds).length !== clothingIds.length) {
    throw createAppError("INTERNAL_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        resource: "template",
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    });
  }

  return clothingIds;
}

const extractTemplateStats = (
  result: unknown,
  input: { wardrobeId: string; templateId: string },
): TargetStats => {
  const stats = extractTargetStats(extractGetItem(result));
  if (!stats) {
    throw createAppError("NOT_FOUND", {
      message: "Template was not found.",
      details: {
        resource: "template",
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    });
  }

  return stats;
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

    const stats = extractTargetStats(item);
    if (!stats) {
      return [];
    }

    return [[item.clothingId, stats] as const];
  });

  return new Map(clothingEntries);
};

const buildTargetStatsMap = (input: {
  wardrobeId: string;
  source: CreateHistorySource;
  clothingStatsResults: unknown[];
}): Map<string, TargetStats> => {
  const targetStatsMap = new Map<string, TargetStats>();

  if (input.source.templateId && input.source.templateStats) {
    targetStatsMap.set(`template:${input.source.templateId}`, input.source.templateStats);
  }

  const clothingStatsMap = extractBatchClothingMap(input.clothingStatsResults);
  for (const clothingId of [...new Set(input.source.clothingIds)]) {
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

  return targetStatsMap;
};

const resolveStatsKey = (fact: DailyStatsCacheUpdateFact): string => `${fact.target.kind}:${fact.target.id}`;

const createHistorySource = async (
  input: CreateHistoryWithStatsWriteInput,
  dependencies: Pick<CreateHistoryWithStatsWriteDependencies, "getTemplate">,
): Promise<CreateHistorySource> => {
  if (input.templateId && input.clothingIds) {
    throw createAppError("CONFLICT", {
      message: "templateId and clothingIds are mutually exclusive",
      details: {
        templateId: input.templateId,
        clothingIdsCount: input.clothingIds.length,
      },
    });
  }

  if (input.templateId) {
    const templateResult = await dependencies.getTemplate?.({
      wardrobeId: input.wardrobeId,
      templateId: input.templateId,
    });
    const clothingIds = extractTemplateClothingIds(
      templateResult,
      {
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    );

    return {
      templateId: input.templateId,
      clothingIds,
      templateStats: extractTemplateStats(templateResult, {
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      }),
    };
  }

  if (!input.clothingIds || input.clothingIds.length === 0) {
    throw createAppError("VALIDATION_ERROR", {
      details: {
        clothingIds: "Either templateId or non-empty clothingIds is required.",
      },
    });
  }

  const normalized = unique(input.clothingIds);
  if (normalized.length !== input.clothingIds.length) {
    throw createAppError("CONFLICT", {
      message: "clothingIds must be unique",
      details: {
        clothingIds: "Duplicate clothingIds are not allowed.",
      },
    });
  }

  return {
    templateId: null,
    clothingIds: normalized,
    templateStats: null,
  };
};

export function createHistoryWithStatsWriteUsecase(
  dependencies: CreateHistoryWithStatsWriteDependencies = {},
) {
  const now = dependencies.now ?? Date.now;
  const generateHistoryId = dependencies.generateHistoryId ?? (() => `hs_${generateUuidV7()}`);
  const templateRepo = createTemplateRepo();
  const clothingBatchGetRepo = createClothingBatchGetRepo();
  const getTemplate = dependencies.getTemplate
    ?? ((input: { wardrobeId: string; templateId: string }) => templateRepo.get(input));
  const batchGetClothingByIds = dependencies.batchGetClothingByIds
    ?? ((input: { wardrobeId: string; clothingIds: string[] }) => clothingBatchGetRepo.batchGetByIds(input));
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));

  return {
    async create(input: CreateHistoryWithStatsWriteInput): Promise<CreateHistoryWithStatsWriteOutput> {
      const source = await createHistorySource(input, { getTemplate });
      const historyId = generateHistoryId();
      const history = createHistoryEntity({
        wardrobeId: input.wardrobeId,
        historyId,
        date: input.date,
        templateId: source.templateId,
        clothingIds: source.clothingIds,
        createdAt: now(),
      });

      const command: HistoryStatsWriteCommand = {
        mode: "create",
        history,
      };
      const clothingStatsResults = source.clothingIds.length > 0
        ? await batchGetClothingByIds({ wardrobeId: input.wardrobeId, clothingIds: [...new Set(source.clothingIds)] })
        : [];
      const targetStatsMap = buildTargetStatsMap({
        wardrobeId: input.wardrobeId,
        source,
        clothingStatsResults,
      });

      const statsItems = buildHistoryStatsWriteItems({
        wearDailyFacts: buildWearDailyFacts(command),
        cacheUpdateFacts: buildDailyStatsCacheUpdateFacts(command),
        resolveCurrentStats: (fact) => targetStatsMap.get(resolveStatsKey(fact)),
      });

      const transactItems: TransactWriteItem[] = [
        {
          Put: {
            Item: buildHistoryItem(history),
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
          },
        },
        ...statsItems,
      ];

      assertHistoryStatsWriteItemsWithinLimit(transactItems);
      await transactWriteItems(transactItems);

      return { historyId };
    },
  };
}
