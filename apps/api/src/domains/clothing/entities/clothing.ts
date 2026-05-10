import type { ClothingEntityShape, ClothingGenre, ClothingStatus } from "../schema/clothingSchema.js";
import type { ItemTagId } from "../../tags/itemTagSchema.js";

export type ClothingEntity = ClothingEntityShape;

export type ClothingEntityKey = {
  wardrobeId: string;
  clothingId: string;
};

export type ClothingCoreAttributes = {
  name: string;
  genre: ClothingGenre;
  imageKey: string | null;
  tagIds: ItemTagId[];
  status: ClothingStatus;
  wearCount: number;
  lastWornAt: number;
  createdAt: number;
  deletedAt: number | null;
};

export type CreateClothingEntityInput = ClothingEntityKey & {
  name: string;
  genre: ClothingGenre;
  imageKey?: string | null;
  tagIds?: ItemTagId[] | undefined;
  now: number;
};

export function createClothingEntity(input: CreateClothingEntityInput): ClothingEntity {
  return {
    wardrobeId: input.wardrobeId,
    clothingId: input.clothingId,
    name: input.name,
    genre: input.genre,
    imageKey: input.imageKey ?? null,
    tagIds: input.tagIds ?? [],
    status: "ACTIVE",
    wearCount: 0,
    lastWornAt: 0,
    createdAt: input.now,
    deletedAt: null,
  };
}

export function markClothingDeleted(entity: ClothingEntity, deletedAt: number): ClothingEntity {
  return {
    ...entity,
    status: "DELETED",
    deletedAt,
  };
}
