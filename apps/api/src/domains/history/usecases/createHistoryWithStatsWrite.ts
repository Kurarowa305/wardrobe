import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createTemplateRepo } from "../../template/repo/templateRepo.js";
import { createHistoryEntity } from "../entities/history.js";
import { buildHistoryItem } from "../repo/historyRepo.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
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
  getTemplate?: ((input: { wardrobeId: string; templateId: string }) => Promise<unknown>) | undefined;
  transactWriteItems?: ((items: TransactWriteItem[]) => Promise<unknown>) | undefined;
};

const unique = (values: string[]): string[] => [...new Set(values)];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const extractGetItem = (result: unknown): unknown => {
  if (!isRecord(result)) {
    return undefined;
  }

  return result.Item ?? result.item;
};

const extractTemplateClothingIds = (templateResult: unknown): string[] | null => {
  const item = extractGetItem(templateResult);
  if (!isRecord(item)) {
    return null;
  }

  if (item.status !== "ACTIVE") {
    return null;
  }

  if (!Array.isArray(item.clothingIds)) {
    throw createAppError("VALIDATION_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        clothingIds: "Template clothingIds must be a non-empty array of strings.",
      },
    });
  }

  if (item.clothingIds.length === 0) {
    throw createAppError("VALIDATION_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        clothingIds: "Template clothingIds must be a non-empty array of strings.",
      },
    });
  }

  if (!item.clothingIds.every((clothingId) => typeof clothingId === "string")) {
    throw createAppError("VALIDATION_ERROR", {
      message: "Template clothingIds is invalid.",
      details: {
        clothingIds: "Template clothingIds must be a non-empty array of strings.",
      },
    });
  }

  return unique(item.clothingIds);
};

const createHistorySource = async (
  input: CreateHistoryWithStatsWriteInput,
  getTemplate: (input: { wardrobeId: string; templateId: string }) => Promise<unknown>,
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
    const templateResult = await getTemplate({
      wardrobeId: input.wardrobeId,
      templateId: input.templateId,
    });
    const templateClothingIds = extractTemplateClothingIds(templateResult);
    if (!templateClothingIds) {
      throw createAppError("NOT_FOUND", {
        message: "Template was not found.",
        details: {
          resource: "template",
          wardrobeId: input.wardrobeId,
          templateId: input.templateId,
        },
      });
    }

    return {
      templateId: input.templateId,
      clothingIds: templateClothingIds,
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
  const getTemplate = dependencies.getTemplate
    ?? ((input: { wardrobeId: string; templateId: string }) => templateRepo.get(input));
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));

  return {
    async create(input: CreateHistoryWithStatsWriteInput): Promise<CreateHistoryWithStatsWriteOutput> {
      const source = await createHistorySource(input, getTemplate);
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
