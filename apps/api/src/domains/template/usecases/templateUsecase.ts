import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createAppError } from "../../../core/errors/index.js";
import { createTemplateRepo, templateListIndexNames, type TemplateItem, type TemplateRepo } from "../repo/templateRepo.js";
import type { TemplateListItemDto, TemplateListOrderDto, TemplateListParamsDto } from "../dto/templateDto.js";
import { createClothingBatchGetRepo, reorderClothingItemsByIds, type BatchGetClothingRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import type { ClothingStatus } from "../../clothing/schema/clothingSchema.js";
import { createTemplateEntity } from "../entities/template.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";

const templateListResource = "template-list";

export type TemplateListCursorPosition = {
  PK: string;
  SK: string;
  statusListPk: string;
  createdAtSk?: string;
  wearCountSk?: string;
  lastWornAtSk?: string;
};

export type ListTemplateUsecaseInput = {
  wardrobeId: string;
  params: TemplateListParamsDto;
  requestId?: string | undefined;
};

export type ListTemplateUsecaseOutput = {
  items: TemplateListItemDto[];
  nextCursor: string | null;
};

export type CreateTemplateUsecaseInput = {
  wardrobeId: string;
  name: string;
  clothingIds: string[];
};

export type CreateTemplateUsecaseOutput = {
  templateId: string;
};

export type TemplateUsecaseRepo = Pick<TemplateRepo, "list" | "create">;

export type TemplateUsecaseDependencies = {
  repo?: TemplateUsecaseRepo | undefined;
  clothingBatchGetRepo?: Pick<BatchGetClothingRepo, "batchGetByIds"> | undefined;
  now?: (() => number) | undefined;
  generateTemplateId?: (() => string) | undefined;
};

type RepoListResult = Awaited<ReturnType<TemplateUsecaseRepo["list"]>>;
type BatchGetResult = Awaited<ReturnType<BatchGetClothingRepo["batchGetByIds"]>>;

type TemplateListQueryResult = {
  Items?: unknown;
  items?: unknown;
  LastEvaluatedKey?: unknown;
  lastEvaluatedKey?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTemplateItem(value: unknown): value is TemplateItem {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.templateId === "string"
    && typeof value.name === "string"
    && Array.isArray(value.clothingIds)
    && value.clothingIds.every((clothingId) => typeof clothingId === "string");
}

function isClothingListItem(value: unknown): value is { clothingId: string; imageKey: string | null; status: ClothingStatus } {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && (value.imageKey === null || typeof value.imageKey === "string")
    && (value.status === "ACTIVE" || value.status === "DELETED");
}

function extractListResult(result: RepoListResult): TemplateListQueryResult {
  if (!isRecord(result)) {
    return {};
  }

  const maybeItem = result as TemplateListQueryResult;
  if ("Items" in maybeItem || "items" in maybeItem || "LastEvaluatedKey" in maybeItem || "lastEvaluatedKey" in maybeItem) {
    return maybeItem;
  }

  return {};
}

function extractItems(result: TemplateListQueryResult): TemplateItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.filter(isTemplateItem) as TemplateItem[];
}

function extractLastEvaluatedKey(result: TemplateListQueryResult): TemplateListCursorPosition | null {
  const candidate = result.LastEvaluatedKey ?? result.lastEvaluatedKey;
  if (!isRecord(candidate)) {
    return null;
  }

  const positionEntries = Object.entries(candidate).filter(([, value]) => {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
  }) as [string, CursorPrimitive][];

  if (positionEntries.length === 0) {
    return null;
  }

  const position = Object.fromEntries(positionEntries) as TemplateListCursorPosition;
  if (typeof position.PK !== "string" || typeof position.SK !== "string" || typeof position.statusListPk !== "string") {
    return null;
  }

  return position;
}

function resolveOrder(order: TemplateListOrderDto | undefined): TemplateListOrderDto {
  return order ?? "desc";
}

function decodeListCursor(input: {
  order: TemplateListOrderDto;
  cursor: string | null | undefined;
  requestId?: string | undefined;
}): TemplateListCursorPosition | undefined {
  const position = decodeCursor<TemplateListCursorPosition>({
    resource: templateListResource,
    order: input.order,
    filters: {},
    cursor: input.cursor,
    requestId: input.requestId,
  });

  return position ?? undefined;
}

function encodeListCursor(input: { order: TemplateListOrderDto; position: TemplateListCursorPosition }): string {
  return encodeCursor({
    resource: templateListResource,
    order: input.order,
    filters: {},
    position: input.position,
  });
}

function resolveIndexName() {
  return templateListIndexNames.createdAt;
}

function extractBatchGetItems(result: BatchGetResult): { clothingId: string; imageKey: string | null; status: ClothingStatus }[] {
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

      return response.filter(isClothingListItem);
    });
  });
}

function toTemplateListItem(item: TemplateItem, clothingItemsById: Map<string, { imageKey: string | null; status: ClothingStatus }>): TemplateListItemDto {
  const clothingItems = reorderClothingItemsByIds(
    item.clothingIds,
    item.clothingIds
      .map((clothingId) => {
        const clothingItem = clothingItemsById.get(clothingId);
        if (!clothingItem) {
          return null;
        }

        return {
          clothingId,
          imageKey: clothingItem.imageKey,
          status: clothingItem.status,
        };
      })
      .filter((candidate): candidate is { clothingId: string; imageKey: string | null; status: ClothingStatus } => candidate !== null),
  );

  return {
    templateId: item.templateId,
    name: item.name,
    clothingItems,
  };
}

export function createTemplateUsecase(dependencies: TemplateUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createTemplateRepo();
  const clothingBatchGetRepo = dependencies.clothingBatchGetRepo ?? createClothingBatchGetRepo();
  const now = dependencies.now ?? Date.now;
  const generateTemplateId = dependencies.generateTemplateId ?? (() => `tp_${generateUuidV7()}`);

  return {
    async create(input: CreateTemplateUsecaseInput): Promise<CreateTemplateUsecaseOutput> {
      const uniqueIds = new Set(input.clothingIds);
      if (uniqueIds.size !== input.clothingIds.length) {
        throw createAppError("CONFLICT", {
          message: "clothingIds must not contain duplicates.",
          details: {
            reason: "duplicate clothingIds",
          },
        });
      }

      const clothingItems = extractBatchGetItems(await clothingBatchGetRepo.batchGetByIds({
        wardrobeId: input.wardrobeId,
        clothingIds: input.clothingIds,
      }));

      const activeIds = new Set(
        clothingItems
          .filter((item) => item.status === "ACTIVE")
          .map((item) => item.clothingId),
      );
      const missingIds = input.clothingIds.filter((clothingId) => !activeIds.has(clothingId));
      if (missingIds.length > 0) {
        throw createAppError("NOT_FOUND", {
          message: "Referenced clothing was not found.",
          details: {
            resource: "clothing",
            wardrobeId: input.wardrobeId,
            clothingIds: missingIds,
          },
        });
      }

      const templateId = generateTemplateId();
      await repo.create(createTemplateEntity({
        wardrobeId: input.wardrobeId,
        templateId,
        name: input.name,
        clothingIds: input.clothingIds,
        now: now(),
      }));

      return {
        templateId,
      };
    },
    async list(input: ListTemplateUsecaseInput): Promise<ListTemplateUsecaseOutput> {
      const order = resolveOrder(input.params.order);
      const decodedCursor = decodeListCursor({
        order,
        cursor: input.params.cursor ?? undefined,
        requestId: input.requestId,
      });

      const listInput = {
        wardrobeId: input.wardrobeId,
        indexName: resolveIndexName(),
        scanIndexForward: order === "asc",
        ...(input.params.limit === undefined ? {} : { limit: input.params.limit }),
        ...(decodedCursor === undefined ? {} : { exclusiveStartKey: decodedCursor }),
      };

      const listResult = extractListResult(await repo.list(listInput));

      const templateItems = extractItems(listResult);
      const uniqueClothingIds = [...new Set(templateItems.flatMap((item) => item.clothingIds))];
      const clothingItemMap = new Map<string, { imageKey: string | null; status: ClothingStatus }>();

      if (uniqueClothingIds.length > 0) {
        const clothingItems = extractBatchGetItems(await clothingBatchGetRepo.batchGetByIds({
          wardrobeId: input.wardrobeId,
          clothingIds: uniqueClothingIds,
        }));

        for (const clothingItem of clothingItems) {
          clothingItemMap.set(clothingItem.clothingId, {
            imageKey: clothingItem.imageKey,
            status: clothingItem.status,
          });
        }
      }

      const lastEvaluatedKey = extractLastEvaluatedKey(listResult);

      return {
        items: templateItems.map((item) => toTemplateListItem(item, clothingItemMap)),
        nextCursor: lastEvaluatedKey
          ? encodeListCursor({
              order,
              position: lastEvaluatedKey,
            })
          : null,
      };
    },
  };
}
