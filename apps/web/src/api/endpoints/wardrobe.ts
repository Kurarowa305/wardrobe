import { apiClient } from "@/api/client";
import type {
  CreateWardrobeRequestDto,
  CreateWardrobeResponseDto,
  WardrobeDetailResponseDto,
} from "@/api/schemas/wardrobe";

const WARDROBE_COLLECTION_PATH = "/wardrobes";

function buildWardrobeDetailPath(wardrobeId: string) {
  return `${WARDROBE_COLLECTION_PATH}/${wardrobeId}`;
}

export function createWardrobe(body: CreateWardrobeRequestDto): Promise<CreateWardrobeResponseDto> {
  return apiClient.post<CreateWardrobeResponseDto, CreateWardrobeRequestDto>(WARDROBE_COLLECTION_PATH, {
    body,
  });
}

export function getWardrobe(wardrobeId: string): Promise<WardrobeDetailResponseDto> {
  return apiClient.get<WardrobeDetailResponseDto>(buildWardrobeDetailPath(wardrobeId));
}
