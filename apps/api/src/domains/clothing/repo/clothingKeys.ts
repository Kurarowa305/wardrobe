import type { ClothingEntityKey } from "../entities/clothing.js";
import type { ClothingGenre, ClothingStatus } from "../schema/clothingSchema.js";

const CLOTHING_PARTITION_SEGMENT = "CLOTH";
const CREATED_AT_PREFIX = "CREATED";
const WEAR_COUNT_PREFIX = "WEAR";
const LAST_WORN_AT_PREFIX = "LASTWORN";
const WEAR_COUNT_PAD_LENGTH = 10;

export type ClothingBaseKey = {
  PK: string;
  SK: string;
};

export type ClothingStatusListKeyInput = {
  wardrobeId: string;
  status: ClothingStatus;
};

export type ClothingStatusGenreListKeyInput = {
  wardrobeId: string;
  status: ClothingStatus;
  genre: ClothingGenre;
};

export type ClothingSortKeyInput = {
  clothingId: string;
  value: number;
};

export function buildClothingBaseKey(input: ClothingEntityKey): ClothingBaseKey {
  return {
    PK: `W#${input.wardrobeId}#${CLOTHING_PARTITION_SEGMENT}`,
    SK: `CLOTH#${input.clothingId}`,
  };
}

export function buildClothingStatusListPk(input: ClothingStatusListKeyInput): string {
  return `W#${input.wardrobeId}#${CLOTHING_PARTITION_SEGMENT}#${input.status}`;
}

export function buildClothingStatusGenreListPk(input: ClothingStatusGenreListKeyInput): string {
  return `W#${input.wardrobeId}#${CLOTHING_PARTITION_SEGMENT}#${input.status}#GENRE#${input.genre}`;
}

export function buildClothingCreatedAtSk(input: ClothingSortKeyInput): string {
  return `${CREATED_AT_PREFIX}#${input.value}#${input.clothingId}`;
}

export function buildClothingWearCountSk(input: ClothingSortKeyInput): string {
  return `${WEAR_COUNT_PREFIX}#${String(input.value).padStart(WEAR_COUNT_PAD_LENGTH, "0")}#${input.clothingId}`;
}

export function buildClothingLastWornAtSk(input: ClothingSortKeyInput): string {
  return `${LAST_WORN_AT_PREFIX}#${input.value}#${input.clothingId}`;
}

export function buildClothingIndexKeys(input: ClothingEntityKey & {
  genre: ClothingGenre;
  status: ClothingStatus;
  createdAt: number;
  wearCount: number;
  lastWornAt: number;
}) {
  return {
    ...buildClothingBaseKey(input),
    statusListPk: buildClothingStatusListPk(input),
    statusGenreListPk: buildClothingStatusGenreListPk(input),
    createdAtSk: buildClothingCreatedAtSk({ clothingId: input.clothingId, value: input.createdAt }),
    wearCountSk: buildClothingWearCountSk({ clothingId: input.clothingId, value: input.wearCount }),
    lastWornAtSk: buildClothingLastWornAtSk({ clothingId: input.clothingId, value: input.lastWornAt }),
  };
}
