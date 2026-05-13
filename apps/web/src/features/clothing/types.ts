import type {
  ClothingDto,
  ClothingGenreDto,
  ClothingListItemDto,
  ClothingRecommendationResponseDto,
  ClothingRecommendationSeasonDto,
} from "@/api/schemas/clothing";
import type { ItemTagIdDto } from "@/api/schemas/itemTag";

export type ClothingListItem = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  tagIds: ItemTagIdDto[];
};

export type Clothing = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  tagIds: ItemTagIdDto[];
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
};

export type ClothingRecommendation = {
  season: ClothingRecommendationSeasonDto;
  seasonTagIds: ItemTagIdDto[];
  items: {
    tops: ClothingListItem[];
    bottoms: ClothingListItem[];
  };
};

export function toClothingListItem(dto: ClothingListItemDto): ClothingListItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    genre: dto.genre,
    imageKey: dto.imageKey,
    tagIds: dto.tagIds,
  };
}

export function toClothing(dto: ClothingDto): Clothing {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    genre: dto.genre,
    imageKey: dto.imageKey,
    tagIds: dto.tagIds,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
  };
}

export function toClothingRecommendation(dto: ClothingRecommendationResponseDto): ClothingRecommendation {
  return {
    season: dto.season,
    seasonTagIds: dto.seasonTagIds,
    items: {
      tops: dto.items.tops.map(toClothingListItem),
      bottoms: dto.items.bottoms.map(toClothingListItem),
    },
  };
}
