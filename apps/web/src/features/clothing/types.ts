import type { ClothingDto, ClothingGenreDto, ClothingListItemDto } from "@/api/schemas/clothing";

export type ClothingListItem = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
};

export type Clothing = {
  clothingId: string;
  name: string;
  genre: ClothingGenreDto;
  imageKey: string | null;
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
};

export function toClothingListItem(dto: ClothingListItemDto): ClothingListItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    genre: dto.genre,
    imageKey: dto.imageKey,
  };
}

export function toClothing(dto: ClothingDto): Clothing {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    genre: dto.genre,
    imageKey: dto.imageKey,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
  };
}
