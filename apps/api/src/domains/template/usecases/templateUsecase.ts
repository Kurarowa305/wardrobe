import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createClothingBatchGetRepo, reorderClothingItemsByIds, type BatchGetClothingRepo } from "../../clothing/repo/clothingBatchGetRepo.js";
import type { ClothingItem } from "../../clothing/repo/clothingRepo.js";
import type { TemplateListClothingItemDto, TemplateListItemDto, TemplateListOrderDto, TemplateListParamsDto } from "../dto/templateDto.js";
import { createTemplateRepo, templateListIndexNames, type TemplateRepo } from "../repo/templateRepo.js";
import type { TemplateItem } from "../repo/templateRepo.js";

const templateListResource = "template-list";
const templateListThumbnailMaxCount = 4;

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

export type TemplateUsecaseDependencies = {
  repo?: Pick<TemplateRepo, "list"> | undefined;
  clothingBatchRepo?: Pick<BatchGetClothingRepo, "batchGetByIds"> | undefined;
};

type RepoListResult = Awaited<ReturnType<Pick<TemplateRepo, "list">["list"]>>;
type RepoBatchGetResult = Awaited<ReturnType<Pick<BatchGetClothingRepo, "batchGetByIds">["batchGetByIds"]>>;

type TemplateListQueryResult = {
  Items?: unknown;
  items?: unknown;
  LastEvaluatedKey?: unknown;
  lastEvaluatedKey?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractListResult(result: RepoListResult): TemplateListQueryResult {
  if (isRecord(result)) {
    const maybeItem = result as TemplateListQueryResult;
    if ("Items" in maybeItem || "items" in maybeItem || "LastEvaluatedKey" in maybeItem || "lastEvaluatedKey" in maybeItem) {
      return maybeItem;
    }

    if ("request" in maybeItem && isRecord(maybeItem.request) && isRecord(maybeItem.request.input)) {
      return {};
    }
  }

  return {};
}

function isTemplateListSourceItem(value: unknown): value is Pick<TemplateItem, "templateId" | "name" | "clothingIds"> {
  return isRecord(value)
    && typeof value.templateId === "string"
    && typeof value.name === "string"
    && Array.isArray(value.clothingIds)
    && value.clothingIds.every((clothingId) => typeof clothingId === "string");
}

function extractItems(result: TemplateListQueryResult): Pick<TemplateItem, "templateId" | "name" | "clothingIds">[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.filter(isTemplateListSourceItem);
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
    cursor: input.cursor,
    requestId: input.requestId,
  });

  return position ?? undefined;
}

function encodeListCursor(input: {
  order: TemplateListOrderDto;
  position: TemplateListCursorPosition;
}): string {
  return encodeCursor({
    resource: templateListResource,
    order: input.order,
    position: input.position,
  });
}

function isClothingListItem(value: unknown): value is Pick<ClothingItem, "clothingId" | "imageKey" | "status"> {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && (value.imageKey === null || typeof value.imageKey === "string")
    && typeof value.status === "string";
}

function extractBatchGetItems(result: RepoBatchGetResult): Pick<ClothingItem, "clothingId" | "imageKey" | "status">[] {
  return result.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const responseItems = (entry as { Responses?: unknown }).Responses;
    if (!isRecord(responseItems)) {
      return [];
    }

    return Object.values(responseItems)
      .flatMap((items) => Array.isArray(items) ? items : [])
      .filter(isClothingListItem);
  });
}

function toTemplateListClothingItems(clothingIds: string[], clothingItems: Pick<ClothingItem, "clothingId" | "imageKey" | "status">[]): TemplateListClothingItemDto[] {
  return reorderClothingItemsByIds(clothingIds, clothingItems)
    .slice(0, templateListThumbnailMaxCount)
    .map((item) => ({
      clothingId: item.clothingId,
      imageKey: item.imageKey,
      status: item.status,
    }));
}

export function createTemplateUsecase(dependencies: TemplateUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createTemplateRepo();
  const clothingBatchRepo = dependencies.clothingBatchRepo ?? createClothingBatchGetRepo();

  return {
    async list(input: ListTemplateUsecaseInput): Promise<ListTemplateUsecaseOutput> {
      const order = resolveOrder(input.params.order);
      const exclusiveStartKey = decodeListCursor({
        order,
        cursor: input.params.cursor,
        requestId: input.requestId,
      });

      const result = extractListResult(await repo.list({
        wardrobeId: input.wardrobeId,
        indexName: templateListIndexNames.createdAt,
        ...(input.params.limit !== undefined ? { limit: input.params.limit } : {}),
        ...(exclusiveStartKey ? { exclusiveStartKey } : {}),
        scanIndexForward: order === "asc",
      }));

      const listItems = extractItems(result);
      const clothingIdSet = new Set(listItems.flatMap((item) => item.clothingIds));
      const resolvedClothingItems = clothingIdSet.size === 0
        ? []
        : extractBatchGetItems(await clothingBatchRepo.batchGetByIds({
            wardrobeId: input.wardrobeId,
            clothingIds: Array.from(clothingIdSet),
          }));

      const items: TemplateListItemDto[] = listItems.map((item) => ({
        templateId: item.templateId,
        name: item.name,
        clothingItems: toTemplateListClothingItems(item.clothingIds, resolvedClothingItems),
      }));

      const nextPosition = extractLastEvaluatedKey(result);

      return {
        items,
        nextCursor: nextPosition
          ? encodeListCursor({ order, position: nextPosition })
          : null,
      };
    },
  };
}
