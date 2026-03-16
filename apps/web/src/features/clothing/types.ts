import type { ClothingDto, ClothingListItemDto } from "@/api/schemas/clothing";

export type ClothingListItem = {
  clothingId: string;
  name: string;
  imageKey: string | null;
};

export type Clothing = {
  clothingId: string;
  name: string;
  imageKey: string | null;
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
};

export function toClothingListItem(dto: ClothingListItemDto): ClothingListItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    imageKey: dto.imageKey,
  };
}

export function toClothing(dto: ClothingDto): Clothing {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    imageKey: dto.imageKey,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
  };
}
