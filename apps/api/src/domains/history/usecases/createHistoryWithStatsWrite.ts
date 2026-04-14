import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createHistoryEntity } from "../entities/history.js";
import { buildHistoryItem } from "../repo/historyRepo.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { createTemplateRepo } from "../../template/repo/templateRepo.js";
import { buildDailyStatsCacheUpdateFacts, buildWearDailyFacts } from "../stats_write/aggregations/daily.js";
import { buildHistoryStatsWriteItems } from "../stats_write/transact/buildItems.js";
import { assertHistoryStatsWriteItemsWithinLimit } from "../stats_write/transact/guard.js";
import type { HistoryStatsWriteCommand } from "../stats_write/types.js";

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
};

const unique = (values: string[]): string[] => [...new Set(values)];

const resolveTemplateClothingIds = (templateResult: unknown, templateId: string): string[] => {
  const candidate = templateResult as { Item?: { clothingIds?: unknown } } | undefined;
  const clothingIds = candidate?.Item?.clothingIds;

  if (!Array.isArray(clothingIds) || clothingIds.length === 0 || clothingIds.some((id) => typeof id !== "string" || id.trim().length === 0)) {
    throw createAppError("VALIDATION_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        templateId,
      },
    });
  }

  const normalized = unique(clothingIds);
  if (normalized.length !== clothingIds.length) {
    throw createAppError("VALIDATION_ERROR", {
      message: "Template clothingIds must be unique.",
      details: {
        templateId,
      },
    });
  }

  return normalized;
};

const createHistorySource = async (
  input: CreateHistoryWithStatsWriteInput,
  dependencies: {
    getTemplate: (params: { wardrobeId: string; templateId: string }) => Promise<unknown>;
  },
): Promise<{ templateId: string; clothingIds: string[] } | {
  templateId: null;
  clothingIds: string[];
}> => {
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
    const templateResult = await dependencies.getTemplate({
      wardrobeId: input.wardrobeId,
      templateId: input.templateId,
    });

    const candidate = templateResult as { Item?: unknown } | undefined;
    if (!candidate?.Item) {
      throw createAppError("NOT_FOUND", {
        message: "Template not found.",
        details: {
          templateId: input.templateId,
        },
      });
    }

    return {
      templateId: input.templateId,
      clothingIds: resolveTemplateClothingIds(templateResult, input.templateId),
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
  };
};

export function createHistoryWithStatsWriteUsecase(
  dependencies: CreateHistoryWithStatsWriteDependencies = {},
) {
  const templateRepo = createTemplateRepo();
  const now = dependencies.now ?? Date.now;
  const generateHistoryId = dependencies.generateHistoryId ?? (() => `hs_${generateUuidV7()}`);
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));
  const getTemplate = dependencies.getTemplate
    ?? ((input: { wardrobeId: string; templateId: string }) => templateRepo.get(input));

  return {
    async create(input: CreateHistoryWithStatsWriteInput): Promise<CreateHistoryWithStatsWriteOutput> {
      const source = await createHistorySource(input, {
        getTemplate,
      });
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
