import { createDynamoDbClient, type TransactWriteItem } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { createHistoryEntity } from "../entities/history.js";
import { buildHistoryItem } from "../repo/historyRepo.js";
import { buildClothingBaseKey } from "../../clothing/repo/clothingKeys.js";
import { buildTemplateBaseKey } from "../../template/repo/templateKeys.js";
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
  transactWriteItems?: ((items: TransactWriteItem[]) => Promise<unknown>) | undefined;
};

const unique = (values: string[]): string[] => [...new Set(values)];

const createHistorySource = (input: CreateHistoryWithStatsWriteInput): { templateId: string; clothingIds: string[] } | {
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

  if (input.templateId) {
    return {
      templateId: input.templateId,
      clothingIds: [],
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

const buildReferenceConditionChecks = (input: {
  wardrobeId: string;
  templateId: string | null;
  clothingIds: string[];
}): TransactWriteItem[] => {
  const templateChecks = input.templateId
    ? [{
        ConditionCheck: {
          Key: buildTemplateBaseKey({
            wardrobeId: input.wardrobeId,
            templateId: input.templateId,
          }),
          ConditionExpression: "attribute_exists(PK)",
        },
      } satisfies TransactWriteItem]
    : [];

  const clothingChecks = input.clothingIds.map((clothingId) => ({
    ConditionCheck: {
      Key: buildClothingBaseKey({
        wardrobeId: input.wardrobeId,
        clothingId,
      }),
      ConditionExpression: "attribute_exists(PK)",
    },
  } satisfies TransactWriteItem));

  return [...templateChecks, ...clothingChecks];
};

export function createHistoryWithStatsWriteUsecase(
  dependencies: CreateHistoryWithStatsWriteDependencies = {},
) {
  const now = dependencies.now ?? Date.now;
  const generateHistoryId = dependencies.generateHistoryId ?? (() => `hs_${generateUuidV7()}`);
  const transactWriteItems = dependencies.transactWriteItems
    ?? ((items: TransactWriteItem[]) => createDynamoDbClient().transactWriteItems({ TransactItems: items }));

  return {
    async create(input: CreateHistoryWithStatsWriteInput): Promise<CreateHistoryWithStatsWriteOutput> {
      const source = createHistorySource(input);
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
        ...buildReferenceConditionChecks({
          wardrobeId: input.wardrobeId,
          templateId: source.templateId,
          clothingIds: source.clothingIds,
        }),
        ...statsItems,
      ];

      assertHistoryStatsWriteItemsWithinLimit(transactItems);
      await transactWriteItems(transactItems);

      return { historyId };
    },
  };
}
