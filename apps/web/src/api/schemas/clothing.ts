export type ClothingStatusDto = "ACTIVE" | "DELETED";

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
