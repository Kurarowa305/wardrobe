import { apiClient } from "@/api/client";
import type {
  CreateWardrobeRequestDto,
  CreateWardrobeResponseDto,
} from "@/api/schemas/wardrobe";

const WARDROBE_COLLECTION_PATH = "/wardrobes";

export function createWardrobe(
  body: CreateWardrobeRequestDto,
): Promise<CreateWardrobeResponseDto> {
  return apiClient.post<CreateWardrobeResponseDto, CreateWardrobeRequestDto>(
    WARDROBE_COLLECTION_PATH,
    {
      body,
    },
  );
}
