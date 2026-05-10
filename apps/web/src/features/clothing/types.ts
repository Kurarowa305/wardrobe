import type { ClothingDto, ClothingGenreDto, ClothingListItemDto } from "@/api/schemas/clothing";
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
