import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createAppError } from "../../../core/errors/index.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { createClothingRepo, clothingListIndexNames, type ClothingRepo } from "../repo/clothingRepo.js";
import type { ClothingDetailResponseDto, ClothingListItemDto, ClothingListOrderDto, ClothingListParamsDto } from "../dto/clothingDto.js";
import type { ClothingItem } from "../repo/clothingRepo.js";
import { createClothingEntity } from "../entities/clothing.js";
import type { ClothingGenre } from "../schema/clothingSchema.js";

const clothingListResource = "clothing-list";

export type ClothingListCursorPosition = {
  PK: string;
  SK: string;
  statusListPk?: string;
  statusGenreListPk?: string;
  createdAtSk?: string;
  wearCountSk?: string;
  lastWornAtSk?: string;
};

export type ListClothingUsecaseInput = {
  wardrobeId: string;
  params: ClothingListParamsDto;
  requestId?: string | undefined;
};

export type ListClothingUsecaseOutput = {
  items: ClothingListItemDto[];
  nextCursor: string | null;
};

export type CreateClothingUsecaseInput = {
  wardrobeId: string;
  name: string;
  genre: ClothingGenre;
  imageKey?: string | null | undefined;
};

export type CreateClothingUsecaseOutput = {
  clothingId: string;
};

export type GetClothingUsecaseInput = {
  wardrobeId: string;
  clothingId: string;
};

export type GetClothingUsecaseOutput = ClothingDetailResponseDto;
export type UpdateClothingUsecaseInput = {
  wardrobeId: string;
  clothingId: string;
  name?: string | undefined;
  genre?: ClothingGenre | undefined;
  imageKey?: string | null | undefined;
};
export type DeleteClothingUsecaseInput = {
  wardrobeId: string;
  clothingId: string;
};

export type ClothingUsecaseRepo = Pick<ClothingRepo, "list" | "create" | "get" | "update" | "delete">;

export type ClothingUsecaseDependencies = {
  repo?: ClothingUsecaseRepo | undefined;
  now?: (() => number) | undefined;
  generateClothingId?: (() => string) | undefined;
};

type RepoListResult = Awaited<ReturnType<ClothingUsecaseRepo["list"]>>;
type RepoGetResult = Awaited<ReturnType<ClothingUsecaseRepo["get"]>>;

type ClothingListQueryResult = {
  Items?: unknown;
  items?: unknown;
  LastEvaluatedKey?: unknown;
  lastEvaluatedKey?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractListResult(result: RepoListResult): ClothingListQueryResult {
  if (isRecord(result)) {
    const maybeItem = result as ClothingListQueryResult;
    if ("Items" in maybeItem || "items" in maybeItem || "LastEvaluatedKey" in maybeItem || "lastEvaluatedKey" in maybeItem) {
      return maybeItem;
    }

    if ("request" in maybeItem && isRecord(maybeItem.request) && isRecord(maybeItem.request.input)) {
      return {};
    }
  }

  return {};
}

function toClothingListItem(item: ClothingItem): ClothingListItemDto {
  return {
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
  };
}

function isClothingListItem(value: unknown): value is Pick<ClothingItem, "clothingId" | "name" | "genre" | "imageKey"> {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && typeof value.name === "string"
    && typeof value.genre === "string"
    && (value.imageKey === null || typeof value.imageKey === "string");
}

function isClothingDetailItem(value: unknown): value is ClothingItem {
  if (!isClothingListItem(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.status === "string"
    && typeof candidate.wearCount === "number"
    && typeof candidate.lastWornAt === "number";
}

function isClothingStatus(value: unknown): value is ClothingItem["status"] {
  return value === "ACTIVE" || value === "DELETED";
}

function extractItems(result: ClothingListQueryResult): ClothingItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

    return candidates.filter(isClothingListItem) as ClothingItem[];
}

function extractLastEvaluatedKey(result: ClothingListQueryResult): ClothingListCursorPosition | null {
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

  const position = Object.fromEntries(positionEntries) as ClothingListCursorPosition;
  if (typeof position.PK !== "string" || typeof position.SK !== "string") {
    return null;
  }

  const hasStatusListPk = typeof position.statusListPk === "string";
  const hasStatusGenreListPk = typeof position.statusGenreListPk === "string";
  if (!hasStatusListPk && !hasStatusGenreListPk) {
    return null;
  }

  return position;
}

function resolveOrder(order: ClothingListOrderDto | undefined): ClothingListOrderDto {
  return order ?? "desc";
}

function createCursorFilters(input: { genre?: string | undefined }) {
  return {
    genre: input.genre,
  };
}

function decodeListCursor(input: {
  wardrobeId: string;
  order: ClothingListOrderDto;
  genre?: string | undefined;
  cursor: string | null | undefined;
  requestId?: string | undefined;
}): ClothingListCursorPosition | undefined {
  const position = decodeCursor<ClothingListCursorPosition>({
    resource: clothingListResource,
    order: input.order,
    filters: createCursorFilters({ genre: input.genre }),
    cursor: input.cursor,
    requestId: input.requestId,
  });

  return position ?? undefined;
}

function encodeListCursor(input: {
  order: ClothingListOrderDto;
  genre?: string | undefined;
  position: ClothingListCursorPosition;
}): string {
  return encodeCursor({
    resource: clothingListResource,
    order: input.order,
    filters: createCursorFilters({ genre: input.genre }),
    position: input.position,
  });
}

function extractClothingItem(result: RepoGetResult): ClothingItem | null {
  if (!isRecord(result)) {
    return null;
  }

  const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { item?: unknown }).item;
  if (!isClothingDetailItem(candidate)) {
    return null;
  }

  return candidate;
}

function extractClothingItemWithBackwardCompatibility(result: RepoGetResult): ClothingItem | null {
  if (!isRecord(result)) {
    return null;
  }

  const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { item?: unknown }).item;
  if (!isClothingListItem(candidate)) {
    return null;
  }

  const detailCandidate = candidate as Record<string, unknown>;
  return {
    wardrobeId: typeof detailCandidate.wardrobeId === "string" ? detailCandidate.wardrobeId : "",
    clothingId: detailCandidate.clothingId,
    name: detailCandidate.name,
    genre: detailCandidate.genre as ClothingItem["genre"],
    imageKey: detailCandidate.imageKey,
    status: isClothingStatus(detailCandidate.status) ? detailCandidate.status : "ACTIVE",
    wearCount: typeof detailCandidate.wearCount === "number" ? detailCandidate.wearCount : 0,
    lastWornAt: typeof detailCandidate.lastWornAt === "number" ? detailCandidate.lastWornAt : 0,
    ...(typeof detailCandidate.createdAt === "number" ? { createdAt: detailCandidate.createdAt } : {}),
    ...(typeof detailCandidate.deletedAt === "number" ? { deletedAt: detailCandidate.deletedAt } : {}),
    ...(typeof detailCandidate.PK === "string" ? { PK: detailCandidate.PK } : {}),
    ...(typeof detailCandidate.SK === "string" ? { SK: detailCandidate.SK } : {}),
    ...(typeof detailCandidate.statusListPk === "string" ? { statusListPk: detailCandidate.statusListPk } : {}),
    ...(typeof detailCandidate.statusGenreListPk === "string" ? { statusGenreListPk: detailCandidate.statusGenreListPk } : {}),
    ...(typeof detailCandidate.createdAtSk === "string" ? { createdAtSk: detailCandidate.createdAtSk } : {}),
    ...(typeof detailCandidate.wearCountSk === "string" ? { wearCountSk: detailCandidate.wearCountSk } : {}),
    ...(typeof detailCandidate.lastWornAtSk === "string" ? { lastWornAtSk: detailCandidate.lastWornAtSk } : {}),
  };
}

function toClothingDetail(item: ClothingItem): ClothingDetailResponseDto {
  return {
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
    status: item.status,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
  };
}

export function createClothingUsecase(dependencies: ClothingUsecaseDependencies = {}) {
  const repo = dependencies.repo ?? createClothingRepo();
  const now = dependencies.now ?? Date.now;
  const generateClothingId = dependencies.generateClothingId ?? (() => `cl_${generateUuidV7()}`);

  return {
    async create(input: CreateClothingUsecaseInput): Promise<CreateClothingUsecaseOutput> {
      const clothingId = generateClothingId();
      await repo.create(createClothingEntity({
        wardrobeId: input.wardrobeId,
        clothingId,
        name: input.name,
        genre: input.genre,
        ...(input.imageKey !== undefined ? { imageKey: input.imageKey } : {}),
        now: now(),
      }));

      return { clothingId };
    },
    async list(input: ListClothingUsecaseInput): Promise<ListClothingUsecaseOutput> {
      const order = resolveOrder(input.params.order);
      const exclusiveStartKey = decodeListCursor({
        wardrobeId: input.wardrobeId,
        order,
        genre: input.params.genre,
        cursor: input.params.cursor,
        requestId: input.requestId,
      });

      const result = extractListResult(await repo.list({
        wardrobeId: input.wardrobeId,
        indexName: input.params.genre
          ? clothingListIndexNames.statusGenreCreatedAt
          : clothingListIndexNames.createdAt,
        ...(input.params.genre ? { genre: input.params.genre } : {}),
        ...(input.params.limit !== undefined ? { limit: input.params.limit } : {}),
        ...(exclusiveStartKey ? { exclusiveStartKey } : {}),
        scanIndexForward: order === "asc",
      }));

      const items = extractItems(result).map(toClothingListItem);
      const nextPosition = extractLastEvaluatedKey(result);

      return {
        items,
        nextCursor: nextPosition
          ? encodeListCursor({ order, genre: input.params.genre, position: nextPosition })
          : null,
      };
    },
    async get(input: GetClothingUsecaseInput): Promise<GetClothingUsecaseOutput> {
      const result = await repo.get({
        wardrobeId: input.wardrobeId,
        clothingId: input.clothingId,
      });
      const item = extractClothingItemWithBackwardCompatibility(result);

      if (!item) {
        throw createAppError("NOT_FOUND", {
          message: "Clothing was not found.",
          details: {
            resource: "clothing",
            wardrobeId: input.wardrobeId,
            clothingId: input.clothingId,
          },
        });
      }

      return toClothingDetail(item);
    },
    async update(input: UpdateClothingUsecaseInput): Promise<void> {
      const currentResult = await repo.get({
        wardrobeId: input.wardrobeId,
        clothingId: input.clothingId,
      });
      const currentItem = extractClothingItem(currentResult);

      if (!currentItem) {
        throw createAppError("NOT_FOUND", {
          message: "Clothing was not found.",
          details: {
            resource: "clothing",
            wardrobeId: input.wardrobeId,
            clothingId: input.clothingId,
          },
        });
      }

      await repo.update({
        ...currentItem,
        name: input.name ?? currentItem.name,
        genre: input.genre ?? currentItem.genre,
        imageKey: input.imageKey !== undefined ? input.imageKey : currentItem.imageKey,
      });
    },
    async delete(input: DeleteClothingUsecaseInput): Promise<void> {
      const currentResult = await repo.get({
        wardrobeId: input.wardrobeId,
        clothingId: input.clothingId,
      });
      const currentItem = extractClothingItem(currentResult);

      if (!currentItem) {
        throw createAppError("NOT_FOUND", {
          message: "Clothing was not found.",
          details: {
            resource: "clothing",
            wardrobeId: input.wardrobeId,
            clothingId: input.clothingId,
          },
        });
      }

      await repo.delete({
        wardrobeId: currentItem.wardrobeId,
        clothingId: currentItem.clothingId,
        deletedAt: now(),
        genre: currentItem.genre,
      });
    },
  };
}
