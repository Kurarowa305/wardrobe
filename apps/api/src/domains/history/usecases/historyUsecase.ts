import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createAppError } from "../../../core/errors/index.js";
import { createHistoryRepo, type HistoryItem, type HistoryRepo } from "../repo/historyRepo.js";
import type {
  HistoryDetailClothingItemDto,
  HistoryDetailResponseDto,
  HistoryListClothingItemDto,
  HistoryListItemDto,
  HistoryListOrderDto,
  HistoryListParamsDto,
} from "../dto/historyDto.js";
import { createHistoryDetailsResolver, type ResolvedHistoryDetails } from "./historyDetailsResolver.js";

const historyListResource = "history-list";

export type HistoryListCursorPosition = {
  PK: string;
  SK: string;
  historyDateSk: string;
};

export type ListHistoryUsecaseInput = {
  wardrobeId: string;
  params: HistoryListParamsDto;
  requestId?: string | undefined;
};

export type ListHistoryUsecaseOutput = {
  items: HistoryListItemDto[];
  nextCursor: string | null;
};

export type GetHistoryUsecaseInput = {
  wardrobeId: string;
  historyId: string;
};

export type GetHistoryUsecaseOutput = HistoryDetailResponseDto;

export type HistoryUsecaseRepo = Pick<HistoryRepo, "list" | "get">;

export type HistoryUsecaseResolver = Pick<ReturnType<typeof createHistoryDetailsResolver>, "resolveMany" | "resolveOne">;

export type HistoryUsecaseDependencies = {
  repo?: HistoryUsecaseRepo | undefined;
  historyDetailsResolver?: HistoryUsecaseResolver | undefined;
};

type RepoListResult = Awaited<ReturnType<HistoryUsecaseRepo["list"]>>;

type HistoryListQueryResult = {
  Items?: unknown;
  items?: unknown;
  LastEvaluatedKey?: unknown;
  lastEvaluatedKey?: unknown;
};

type HistoryDetailGetResult = {
  Item?: unknown;
  item?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isHistoryItem(value: unknown): value is HistoryItem {
  return isRecord(value)
    && typeof value.wardrobeId === "string"
    && typeof value.historyId === "string"
    && typeof value.date === "string"
    && (value.templateId === null || typeof value.templateId === "string")
    && Array.isArray(value.clothingIds)
    && value.clothingIds.every((clothingId) => typeof clothingId === "string")
    && typeof value.createdAt === "number";
}

function extractListResult(result: RepoListResult): HistoryListQueryResult {
  if (!isRecord(result)) {
    return {};
  }

  const maybeItem = result as HistoryListQueryResult;
  if ("Items" in maybeItem || "items" in maybeItem || "LastEvaluatedKey" in maybeItem || "lastEvaluatedKey" in maybeItem) {
    return maybeItem;
  }

  return {};
}

function extractGetResult(result: unknown): HistoryDetailGetResult {
  if (!isRecord(result)) {
    return {};
  }

  const maybeItem = result as HistoryDetailGetResult;
  if ("Item" in maybeItem || "item" in maybeItem) {
    return maybeItem;
  }

  return {};
}

function extractItems(result: HistoryListQueryResult): HistoryItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.filter(isHistoryItem);
}

function extractLastEvaluatedKey(result: HistoryListQueryResult): HistoryListCursorPosition | null {
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

  const position = Object.fromEntries(positionEntries) as HistoryListCursorPosition;
  if (
    typeof position.PK !== "string"
    || typeof position.SK !== "string"
    || typeof position.historyDateSk !== "string"
  ) {
    return null;
  }

  return position;
}

function resolveOrder(order: HistoryListOrderDto | undefined): HistoryListOrderDto {
  return order ?? "desc";
}

function createCursorFilters(input: { from?: string | undefined; to?: string | undefined }) {
  return {
    from: input.from,
    to: input.to,
  };
}

function decodeListCursor(input: {
  order: HistoryListOrderDto;
  from?: string | undefined;
  to?: string | undefined;
  cursor: string | null | undefined;
  requestId?: string | undefined;
}): HistoryListCursorPosition | undefined {
  const position = decodeCursor<HistoryListCursorPosition>({
    resource: historyListResource,
    order: input.order,
    filters: createCursorFilters({ from: input.from, to: input.to }),
    cursor: input.cursor,
    requestId: input.requestId,
  });

  return position ?? undefined;
}

function encodeListCursor(input: {
  order: HistoryListOrderDto;
  from?: string | undefined;
  to?: string | undefined;
  position: HistoryListCursorPosition;
}): string {
  return encodeCursor({
    resource: historyListResource,
    order: input.order,
    filters: createCursorFilters({ from: input.from, to: input.to }),
    position: input.position,
  });
}

function toHistoryListClothingItems(details: ResolvedHistoryDetails): HistoryListClothingItemDto[] {
  return details.clothingItems.map((item) => ({
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
    status: item.status,
  }));
}

function toHistoryDetailClothingItems(details: ResolvedHistoryDetails): HistoryDetailClothingItemDto[] {
  return details.clothingItems.map((item) => ({
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
    status: item.status,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
  }));
}

export function createHistoryUsecase(dependencies: HistoryUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createHistoryRepo();
  const historyDetailsResolver = dependencies.historyDetailsResolver ?? createHistoryDetailsResolver();

  return {
    async get(input: GetHistoryUsecaseInput): Promise<GetHistoryUsecaseOutput> {
      const result = extractGetResult(await repo.get({
        wardrobeId: input.wardrobeId,
        historyId: input.historyId,
      }));
      const history = result.Item ?? result.item;

      if (!isHistoryItem(history)) {
        throw createAppError("NOT_FOUND", {
          message: "History was not found.",
          details: {
            resource: "history",
            wardrobeId: input.wardrobeId,
            historyId: input.historyId,
          },
        });
      }

      const detail = await historyDetailsResolver.resolveOne({
        wardrobeId: input.wardrobeId,
        history,
      });

      return {
        date: detail.date,
        templateName: detail.templateName,
        clothingItems: toHistoryDetailClothingItems(detail),
      };
    },
    async list(input: ListHistoryUsecaseInput): Promise<ListHistoryUsecaseOutput> {
      const order = resolveOrder(input.params.order);
      const exclusiveStartKey = decodeListCursor({
        order,
        from: input.params.from,
        to: input.params.to,
        cursor: input.params.cursor,
        requestId: input.requestId,
      });

      const result = extractListResult(await repo.list({
        wardrobeId: input.wardrobeId,
        ...(input.params.from !== undefined ? { from: input.params.from } : {}),
        ...(input.params.to !== undefined ? { to: input.params.to } : {}),
        order,
        ...(input.params.limit !== undefined ? { limit: input.params.limit } : {}),
        ...(exclusiveStartKey ? { exclusiveStartKey } : {}),
      }));

      const histories = extractItems(result);
      const details = await historyDetailsResolver.resolveMany({
        wardrobeId: input.wardrobeId,
        histories,
      });
      const detailsById = new Map(details.map((detail) => [detail.historyId, detail]));
      const nextPosition = extractLastEvaluatedKey(result);

      return {
        items: histories.map((history) => {
          const detail = detailsById.get(history.historyId);

          return {
            historyId: history.historyId,
            date: history.date,
            name: detail?.templateName ?? null,
            clothingItems: detail ? toHistoryListClothingItems(detail) : [],
          };
        }),
        nextCursor: nextPosition
          ? encodeListCursor({ order, from: input.params.from, to: input.params.to, position: nextPosition })
          : null,
      };
    },
  };
}
