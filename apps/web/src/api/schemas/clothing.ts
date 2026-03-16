export type ClothingStatusDto = "ACTIVE" | "DELETED";
export type ClothingListOrderDto = "asc" | "desc";

export type ClothingListParamsDto = {
  order?: ClothingListOrderDto;
  limit?: number;
  cursor?: string | null;
};

export type CreateClothingRequestDto = {
  name: string;
  imageKey?: string | null;
};

export type UpdateClothingRequestDto = {
  name?: string;
  imageKey?: string | null;
};

export type ClothingDto = {
  clothingId: string;
  name: string;
  imageKey: string | null;
  status: ClothingStatusDto;
  wearCount: number;
  lastWornAt: number;
};

export type ClothingListItemDto = Pick<ClothingDto, "clothingId" | "name" | "imageKey">;

export type ClothingListResponseDto = {
  items: ClothingListItemDto[];
  nextCursor: string | null;
};

export type ClothingDetailResponseDto = ClothingDto;
