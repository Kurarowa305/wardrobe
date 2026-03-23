import type { ClothingEntityShape, ClothingGenre, ClothingStatus } from "../schema/clothingSchema.js";

export type ClothingEntity = ClothingEntityShape;

export type ClothingEntityKey = {
  wardrobeId: string;
  clothingId: string;
};

export type ClothingCoreAttributes = {
  name: string;
  genre: ClothingGenre;
  imageKey: string | null;
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
  now: number;
};

export function createClothingEntity(input: CreateClothingEntityInput): ClothingEntity {
  return {
    wardrobeId: input.wardrobeId,
    clothingId: input.clothingId,
    name: input.name,
    genre: input.genre,
    imageKey: input.imageKey ?? null,
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
