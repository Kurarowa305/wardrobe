import { apiClient } from "@/api/client";
import type {
  ClothingDetailResponseDto,
  ClothingListParamsDto,
  ClothingListResponseDto,
  CreateClothingRequestDto,
  UpdateClothingRequestDto,
} from "@/api/schemas/clothing";

function buildClothingCollectionPath(wardrobeId: string) {
  return `/wardrobes/${wardrobeId}/clothing`;
}

function buildClothingDetailPath(wardrobeId: string, clothingId: string) {
  return `${buildClothingCollectionPath(wardrobeId)}/${clothingId}`;
}

export function listClothings(
  wardrobeId: string,
  params: ClothingListParamsDto = {},
): Promise<ClothingListResponseDto> {
  return apiClient.get<ClothingListResponseDto>(buildClothingCollectionPath(wardrobeId), {
    query: params,
  });
}

export function getClothing(
  wardrobeId: string,
  clothingId: string,
): Promise<ClothingDetailResponseDto> {
  return apiClient.get<ClothingDetailResponseDto>(buildClothingDetailPath(wardrobeId, clothingId));
}

export function createClothing(
  wardrobeId: string,
  body: CreateClothingRequestDto,
): Promise<void> {
  return apiClient.post<void, CreateClothingRequestDto>(buildClothingCollectionPath(wardrobeId), {
    body,
  });
}

export function updateClothing(
  wardrobeId: string,
  clothingId: string,
  body: UpdateClothingRequestDto,
): Promise<void> {
  return apiClient.patch<void, UpdateClothingRequestDto>(
    buildClothingDetailPath(wardrobeId, clothingId),
    {
      body,
    },
  );
}

export function deleteClothing(wardrobeId: string, clothingId: string): Promise<void> {
  return apiClient.delete<void>(buildClothingDetailPath(wardrobeId, clothingId));
}
