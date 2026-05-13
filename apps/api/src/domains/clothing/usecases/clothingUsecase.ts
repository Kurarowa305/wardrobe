import { decodeCursor, encodeCursor, type CursorPrimitive } from "../../../core/cursor/index.js";
import { createAppError } from "../../../core/errors/index.js";
import { generateUuidV7 } from "../../wardrobe/usecases/wardrobeUsecase.js";
import { createClothingRepo, clothingListIndexNames, type ClothingRepo } from "../repo/clothingRepo.js";
import type {
  ClothingDetailResponseDto,
  ClothingListItemDto,
  ClothingListOrderDto,
  ClothingListParamsDto,
  ClothingRecommendationItemDto,
  ClothingRecommendationsResponseDto,
  ClothingRecommendationSeasonDto,
} from "../dto/clothingDto.js";
import { toClothingDetailResponseDto } from "../dto/clothingDetailDto.js";
import type { ClothingItem } from "../repo/clothingRepo.js";
import { createClothingEntity } from "../entities/clothing.js";
import type { ClothingGenre } from "../schema/clothingSchema.js";
import { normalizeItemTagIds, type ItemTagId } from "../../tags/itemTagSchema.js";

const clothingListResource = "clothing-list";
const clothingRecommendationPageSize = 50;
const clothingRecommendationLimitPerGenre = 2;
const jstOffsetMs = 9 * 60 * 60 * 1000;

const seasonTagBySeason: Record<ClothingRecommendationSeasonDto, ItemTagId> = {
  spring: "season:spring",
  summer: "season:summer",
  autumn: "season:autumn",
  winter: "season:winter",
};

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
  tagIds?: ItemTagId[] | undefined;
};

export type CreateClothingUsecaseOutput = {
  clothingId: string;
};

export type GetClothingUsecaseInput = {
  wardrobeId: string;
  clothingId: string;
};

export type GetClothingUsecaseOutput = ClothingDetailResponseDto;
export type GetClothingRecommendationsUsecaseInput = {
  wardrobeId: string;
};
export type GetClothingRecommendationsUsecaseOutput = ClothingRecommendationsResponseDto;
export type UpdateClothingUsecaseInput = {
  wardrobeId: string;
  clothingId: string;
  name?: string | undefined;
  genre?: ClothingGenre | undefined;
  imageKey?: string | null | undefined;
  tagIds?: ItemTagId[] | undefined;
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
    tagIds: normalizeItemTagIds(item.tagIds),
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

function extractItems(result: ClothingListQueryResult): ClothingItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

    return candidates.filter(isClothingListItem) as ClothingItem[];
}

function extractRecommendationItems(result: ClothingListQueryResult): ClothingItem[] {
  const candidates = result.Items ?? result.items;
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.filter(isClothingDetailItem) as ClothingItem[];
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

function extractClothingItemWithBackwardCompatibility(result: RepoGetResult): ClothingDetailResponseDto | null {
  if (!isRecord(result)) {
    return null;
  }

  const candidate = (result as { Item?: unknown; item?: unknown }).Item ?? (result as { item?: unknown }).item;
  return toClothingDetailResponseDto(candidate);
}

function toClothingDetail(item: ClothingItem): ClothingDetailResponseDto {
  return {
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
    tagIds: normalizeItemTagIds(item.tagIds),
    status: item.status,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
  };
}

function getJstMonth(epochMs: number): number {
  return new Date(epochMs + jstOffsetMs).getUTCMonth() + 1;
}

export function resolveClothingRecommendationSeason(epochMs: number): ClothingRecommendationSeasonDto {
  const month = getJstMonth(epochMs);

  if (month >= 3 && month <= 5) {
    return "spring";
  }

  if (month >= 6 && month <= 8) {
    return "summer";
  }

  if (month >= 9 && month <= 11) {
    return "autumn";
  }

  return "winter";
}

function buildRecommendationSeasonTagIds(season: ClothingRecommendationSeasonDto): ItemTagId[] {
  return [seasonTagBySeason[season], "season:all"];
}

function isRecommendationGenre(genre: ClothingGenre): genre is "tops" | "bottoms" {
  return genre === "tops" || genre === "bottoms";
}

function toClothingRecommendationItem(item: ClothingItem): ClothingRecommendationItemDto | null {
  if (!isRecommendationGenre(item.genre)) {
    return null;
  }

  return {
    clothingId: item.clothingId,
    name: item.name,
    genre: item.genre,
    imageKey: item.imageKey,
    tagIds: normalizeItemTagIds(item.tagIds),
    status: item.status,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
  };
}

function hasEnoughRecommendations(items: { tops: unknown[]; bottoms: unknown[] }): boolean {
  return items.tops.length >= clothingRecommendationLimitPerGenre
    && items.bottoms.length >= clothingRecommendationLimitPerGenre;
}

function matchesAnySeasonTag(item: ClothingItem, seasonTagIds: ItemTagId[]): boolean {
  const tagSet = new Set(seasonTagIds);
  return normalizeItemTagIds(item.tagIds).some((tagId) => tagSet.has(tagId));
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
        ...(input.tagIds !== undefined ? { tagIds: input.tagIds } : {}),
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

      return item;
    },
    async getRecommendations(
      input: GetClothingRecommendationsUsecaseInput,
    ): Promise<GetClothingRecommendationsUsecaseOutput> {
      const season = resolveClothingRecommendationSeason(now());
      const seasonTagIds = buildRecommendationSeasonTagIds(season);
      const items: GetClothingRecommendationsUsecaseOutput["items"] = {
        tops: [],
        bottoms: [],
      };
      let exclusiveStartKey: ClothingListCursorPosition | undefined;

      while (!hasEnoughRecommendations(items)) {
        const result = extractListResult(await repo.list({
          wardrobeId: input.wardrobeId,
          indexName: clothingListIndexNames.lastWornAt,
          status: "ACTIVE",
          limit: clothingRecommendationPageSize,
          ...(exclusiveStartKey ? { exclusiveStartKey } : {}),
          scanIndexForward: true,
        }));

        for (const item of extractRecommendationItems(result)) {
          if (!matchesAnySeasonTag(item, seasonTagIds)) {
            continue;
          }

          const recommendationItem = toClothingRecommendationItem(item);
          if (!recommendationItem) {
            continue;
          }

          const genreItems = items[recommendationItem.genre];
          if (genreItems.length < clothingRecommendationLimitPerGenre) {
            genreItems.push(recommendationItem);
          }

          if (hasEnoughRecommendations(items)) {
            break;
          }
        }

        const nextPosition = extractLastEvaluatedKey(result);
        if (!nextPosition) {
          break;
        }
        exclusiveStartKey = nextPosition;
      }

      return {
        season,
        seasonTagIds,
        items,
      };
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
        tagIds: input.tagIds !== undefined ? input.tagIds : normalizeItemTagIds(currentItem.tagIds),
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
