import type { ItemTagIdDto } from "@/api/schemas/itemTag";

export type ClothingStatusDto = "ACTIVE" | "DELETED";
export type ClothingListOrderDto = "asc" | "desc";
export type ClothingGenreDto = "tops" | "bottoms" | "others";
export type ClothingRecommendationSeasonDto = "spring" | "summer" | "autumn" | "winter";

export type ClothingListParamsDto = {
  order?: ClothingListOrderDto;
  genre?: ClothingGenreDto;
  limit?: number;
  cursor?: string | null;
};

export type CreateClothingRequestDto = {
  name: string;
  genre: ClothingGenreDto;
  imageKey?: string | null;
  tagIds?: ItemTagIdDto[];
};

export type UpdateClothingRequestDto = {
  name?: string;
  genre?: ClothingGenreDto;
  imageKey?: string | null;
  tagIds?: ItemTagIdDto[];
};

export type ClothingDto = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  tagIds: ItemTagIdDto[];
  status: ClothingStatusDto;
  wearCount: number;
  lastWornAt: number;
};

export type ClothingListItemDto = Pick<ClothingDto, "clothingId" | "name" | "genre" | "imageKey" | "tagIds">;

export type ClothingListResponseDto = {
  items: ClothingListItemDto[];
  nextCursor: string | null;
};

export type ClothingDetailResponseDto = ClothingDto;
export type ClothingRecommendationItemDto = ClothingDto & {
  genre: "tops" | "bottoms";
};

export type ClothingRecommendationResponseDto = {
  season: ClothingRecommendationSeasonDto;
  seasonTagIds: ItemTagIdDto[];
  items: {
    tops: ClothingRecommendationItemDto[];
    bottoms: ClothingRecommendationItemDto[];
  };
};
