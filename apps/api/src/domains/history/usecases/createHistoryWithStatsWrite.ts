import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createHistoryEntity } from "../entities/history.js";
import { buildHistoryItem } from "../repo/historyRepo.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { buildDailyStatsCacheUpdateFacts, buildWearDailyFacts } from "../stats_write/aggregations/daily.js";
import { buildHistoryStatsWriteItems } from "../stats_write/transact/buildItems.js";
import { assertHistoryStatsWriteItemsWithinLimit } from "../stats_write/transact/guard.js";
import type { HistoryStatsWriteCommand } from "../stats_write/types.js";
import { createTemplateRepo, type TemplateRepo } from "../../template/repo/templateRepo.js";

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
  templateRepo?: Pick<TemplateRepo, "get"> | undefined;
};

const unique = (values: string[]): string[] => [...new Set(values)];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractTemplateClothingIds(result: unknown): string[] | null {
  if (!isRecord(result)) {
    return null;
  }

  const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { Item?: unknown; item?: unknown }).item;
  if (!isRecord(candidate) || !Array.isArray(candidate.clothingIds)) {
    return null;
  }

  const clothingIds = candidate.clothingIds;
  if (clothingIds.length === 0 || !clothingIds.every((clothingId) => typeof clothingId === "string")) {
    return null;
  }

  return unique(clothingIds);
}

const createHistorySourceFromInput = (input: CreateHistoryWithStatsWriteInput): {
  templateId: null;
  clothingIds: string[];
} => {
  if (input.templateId && input.clothingIds) {
    throw createAppError("CONFLICT", {
      message: "templateId and clothingIds are mutually exclusive",
      details: {
        templateId: input.templateId,
        clothingIdsCount: input.clothingIds.length,
      },
    });
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
  };
};

export function createHistoryWithStatsWriteUsecase(
  dependencies: CreateHistoryWithStatsWriteDependencies = {},
) {
  const now = dependencies.now ?? Date.now;
  const generateHistoryId = dependencies.generateHistoryId ?? (() => `hs_${generateUuidV7()}`);
  const templateRepo = dependencies.templateRepo ?? createTemplateRepo();
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));

  return {
    async create(input: CreateHistoryWithStatsWriteInput): Promise<CreateHistoryWithStatsWriteOutput> {
      if (input.templateId && input.clothingIds) {
        throw createAppError("CONFLICT", {
          message: "templateId and clothingIds are mutually exclusive",
          details: {
            templateId: input.templateId,
            clothingIdsCount: input.clothingIds.length,
          },
        });
      }

      let source: { templateId: string; clothingIds: string[] } | { templateId: null; clothingIds: string[] };
      if (typeof input.templateId === "string") {
        const templateId = input.templateId;
        const template = await templateRepo.get({
          wardrobeId: input.wardrobeId,
          templateId,
        });
        const templateClothingIds = extractTemplateClothingIds(template);

        if (!templateClothingIds) {
          throw createAppError("NOT_FOUND", {
            message: "Referenced template was not found.",
            details: {
              wardrobeId: input.wardrobeId,
              templateId,
            },
          });
        }

        source = {
          templateId,
          clothingIds: templateClothingIds,
        };
      } else {
        source = {
          templateId: null,
          clothingIds: createHistorySourceFromInput(input).clothingIds,
        };
      }
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

      const statsItems = buildHistoryStatsWriteItems({
        wearDailyFacts: buildWearDailyFacts(command),
        cacheUpdateFacts: buildDailyStatsCacheUpdateFacts(command),
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
