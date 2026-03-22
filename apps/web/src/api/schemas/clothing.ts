export type ClothingStatusDto = "ACTIVE" | "DELETED";
export type ClothingListOrderDto = "asc" | "desc";
export type ClothingGenreDto = "tops" | "bottoms" | "others";

export type ClothingListParamsDto = {
  order?: ClothingListOrderDto;
  genre?: ClothingGenreDto;
  limit?: number;
};

export type CreateClothingRequestDto = {
  name: string;
  genre: ClothingGenreDto;
  imageKey?: string | null;
};

export type UpdateClothingRequestDto = {
  name?: string;
  genre?: ClothingGenreDto;
  imageKey?: string | null;
};

export type ClothingDto = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  status: ClothingStatusDto;
  wearCount: number;
  lastWornAt: number;
};

export type ClothingListItemDto = Pick<ClothingDto, "clothingId" | "name" | "genre" | "imageKey">;

export type ClothingListResponseDto = {
  items: ClothingListItemDto[];
};

export type ClothingDetailResponseDto = ClothingDto;
