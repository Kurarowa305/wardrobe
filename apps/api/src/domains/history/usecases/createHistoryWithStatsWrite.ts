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
  transactWriteItems?: ((items: TransactWriteItem[]) => Promise<unknown>) | undefined;
  getTemplate?: ((input: { wardrobeId: string; templateId: string }) => Promise<unknown>) | undefined;
};

const unique = (values: string[]): string[] => [...new Set(values)];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractTemplateClothingIds(
  result: unknown,
  input: { wardrobeId: string; templateId: string },
): string[] {
  const candidate = isRecord(result)
    ? (result as { Item?: unknown; item?: unknown }).Item ?? (result as { Item?: unknown; item?: unknown }).item
    : undefined;

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

const createHistorySource = async (
  input: CreateHistoryWithStatsWriteInput,
  dependencies: Pick<CreateHistoryWithStatsWriteDependencies, "getTemplate">,
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
    const clothingIds = extractTemplateClothingIds(
      await dependencies.getTemplate?.({
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      }),
      {
        wardrobeId: input.wardrobeId,
        templateId: input.templateId,
      },
    );

    return {
      templateId: input.templateId,
      clothingIds,
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
  const now = dependencies.now ?? Date.now;
  const generateHistoryId = dependencies.generateHistoryId ?? (() => `hs_${generateUuidV7()}`);
  const templateRepo = createTemplateRepo();
  const getTemplate = dependencies.getTemplate
    ?? ((input: { wardrobeId: string; templateId: string }) => templateRepo.get(input));
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
