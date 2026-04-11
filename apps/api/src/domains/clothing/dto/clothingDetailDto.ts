import type { ClothingDetailResponseDto } from "./clothingDto.js";
import type { ClothingGenre, ClothingStatus } from "../schema/clothingSchema.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasClothingBaseFields(value: unknown): value is {
  clothingId: string;
  name: string;
  genre: unknown;
  imageKey: string | null;
} {
  return isRecord(value)
    && typeof value.clothingId === "string"
    && typeof value.name === "string"
    && (value.imageKey === null || typeof value.imageKey === "string");
}

function isClothingStatus(value: unknown): value is ClothingStatus {
  return value === "ACTIVE" || value === "DELETED";
}

function isClothingGenre(value: unknown): value is ClothingGenre {
  return value === "tops" || value === "bottoms" || value === "others";
}

export function toClothingDetailResponseDto(value: unknown): ClothingDetailResponseDto | null {
  if (!hasClothingBaseFields(value)) {
    return null;
  }

  const detailCandidate = value as Record<string, unknown>;

  return {
    clothingId: value.clothingId,
    name: value.name,
    genre: isClothingGenre(value.genre) ? value.genre : "others",
    imageKey: value.imageKey,
    status: isClothingStatus(detailCandidate.status) ? detailCandidate.status : "ACTIVE",
    wearCount: typeof detailCandidate.wearCount === "number" ? detailCandidate.wearCount : 0,
    lastWornAt: typeof detailCandidate.lastWornAt === "number" ? detailCandidate.lastWornAt : 0,
  };
}
