import { createClothingBatchGetRepo, reorderClothingItemsByIds, type BatchGetClothingRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import type { ClothingGenre, ClothingStatus } from "../../clothing/schema/clothingSchema.js";
import type { HistoryEntity } from "../entities/history.js";
import { createTemplateRepo, type TemplateRepo } from "../../template/repo/templateRepo.js";

export type ResolvedHistoryClothingItem = {
  clothingId: string;
  name: string;
  genre: ClothingGenre;
  imageKey: string | null;
  status: ClothingStatus;
  wearCount: number;
  lastWornAt: number;
};

export type ResolvedHistoryDetails = {
  historyId: string;
  date: string;
  templateName: string | null;
  clothingItems: ResolvedHistoryClothingItem[];
};

export type HistoryDetailsResolverDependencies = {
  clothingBatchGetRepo?: Pick<BatchGetClothingRepo, "batchGetByIds"> | undefined;
  templateRepo?: Pick<TemplateRepo, "get"> | undefined;
};

type BatchGetResult = Awaited<ReturnType<BatchGetClothingRepo["batchGetByIds"]>>;

type TemplateGetResult = Awaited<ReturnType<TemplateRepo["get"]>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isResolvedHistoryClothingItem(value: unknown): value is ResolvedHistoryClothingItem {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && typeof value.name === "string"
    && (value.genre === "tops" || value.genre === "bottoms" || value.genre === "others")
    && (value.imageKey === null || typeof value.imageKey === "string")
    && (value.status === "ACTIVE" || value.status === "DELETED")
    && typeof value.wearCount === "number"
    && Number.isInteger(value.wearCount)
    && value.wearCount >= 0
    && typeof value.lastWornAt === "number"
    && Number.isInteger(value.lastWornAt)
    && value.lastWornAt >= 0;
}

function extractBatchGetItems(result: BatchGetResult): ResolvedHistoryClothingItem[] {
  return result.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const responses = (entry as { Responses?: unknown }).Responses;
    if (!isRecord(responses)) {
      return [];
    }

    return Object.values(responses).flatMap((response) => {
      if (!Array.isArray(response)) {
        return [];
      }

      return response.filter(isResolvedHistoryClothingItem);
    });
  });
}

function extractTemplateName(result: TemplateGetResult): string | null {
  if (!isRecord(result)) {
    return null;
  }

  const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { Item?: unknown; item?: unknown }).item;
  if (!isRecord(candidate) || typeof candidate.name !== "string") {
    return null;
  }

  return candidate.name;
}

export function createHistoryDetailsResolver(dependencies: HistoryDetailsResolverDependencies = {}) {
  const clothingBatchGetRepo = dependencies.clothingBatchGetRepo ?? createClothingBatchGetRepo();
  const templateRepo = dependencies.templateRepo ?? createTemplateRepo();

  const resolveMany = async (input: { wardrobeId: string; histories: HistoryEntity[] }): Promise<ResolvedHistoryDetails[]> => {
      const uniqueClothingIds = [...new Set(input.histories.flatMap((history) => history.clothingIds))];
      const uniqueTemplateIds = [...new Set(input.histories.flatMap((history) => (history.templateId ? [history.templateId] : [])))];

      const [clothingBatchResult, templateNamePairs] = await Promise.all([
        uniqueClothingIds.length > 0
          ? clothingBatchGetRepo.batchGetByIds({
              wardrobeId: input.wardrobeId,
              clothingIds: uniqueClothingIds,
            })
          : Promise.resolve([]),
        Promise.all(
          uniqueTemplateIds.map(async (templateId) => {
            const templateResult = await templateRepo.get({
              wardrobeId: input.wardrobeId,
              templateId,
            });

            return [templateId, extractTemplateName(templateResult)] as const;
          }),
        ),
      ]);

      const clothingMap = new Map(extractBatchGetItems(clothingBatchResult).map((item) => [item.clothingId, item]));
      const templateNameMap = new Map(templateNamePairs);

      return input.histories.map((history) => ({
        historyId: history.historyId,
        date: history.date,
        templateName: history.templateId ? (templateNameMap.get(history.templateId) ?? null) : null,
        clothingItems: reorderClothingItemsByIds(
          history.clothingIds,
          history.clothingIds
            .map((clothingId) => clothingMap.get(clothingId))
            .filter((item): item is ResolvedHistoryClothingItem => item !== undefined),
        ),
      }));
  };

  const resolveOne = async (input: { wardrobeId: string; history: HistoryEntity }): Promise<ResolvedHistoryDetails> => {
      const [resolved] = await resolveMany({
        wardrobeId: input.wardrobeId,
        histories: [input.history],
      });

      if (!resolved) {
        throw new Error("Failed to resolve history details.");
      }

      return resolved;
  };

  return {
    resolveMany,
    resolveOne,
  };
}
