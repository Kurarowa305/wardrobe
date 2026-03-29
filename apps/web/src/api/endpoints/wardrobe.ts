import { apiClient } from "@/api/client";
import type {
  CreateWardrobeRequestDto,
  CreateWardrobeResponseDto,
  WardrobeDetailResponseDto,
} from "@/api/schemas/wardrobe";

function buildWardrobeCollectionPath() {
  return "/wardrobes";
}

function buildWardrobeDetailPath(wardrobeId: string) {
  return `${buildWardrobeCollectionPath()}/${wardrobeId}`;
}

export function createWardrobe(body: CreateWardrobeRequestDto): Promise<CreateWardrobeResponseDto> {
  return apiClient.post<CreateWardrobeResponseDto, CreateWardrobeRequestDto>(
    buildWardrobeCollectionPath(),
    {
      body,
    },
  );
}

export function getWardrobe(wardrobeId: string): Promise<WardrobeDetailResponseDto> {
  return apiClient.get<WardrobeDetailResponseDto>(buildWardrobeDetailPath(wardrobeId));
}
