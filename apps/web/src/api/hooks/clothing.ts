import { useQuery } from "@tanstack/react-query";
import { getClothing, listClothings } from "@/api/endpoints/clothing";
import { queryKeys } from "@/api/queryKeys";
import type { ClothingListParamsDto } from "@/api/schemas/clothing";
import { toClothing, toClothingListItem } from "@/features/clothing/types";

const CLOTHING_LIST_STALE_TIME_MS = 60_000;

export function useClothingList(wardrobeId: string, params: ClothingListParamsDto = {}) {
  return useQuery({
    queryKey: queryKeys.clothing.list(wardrobeId, params),
    queryFn: () => listClothings(wardrobeId, params),
    staleTime: CLOTHING_LIST_STALE_TIME_MS,
    enabled: wardrobeId.length > 0,
    select: (response) => ({
      items: response.items.map(toClothingListItem),
      nextCursor: response.nextCursor,
    }),
  });
}

export function useClothing(wardrobeId: string, clothingId: string) {
  return useQuery({
    queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),
    queryFn: () => getClothing(wardrobeId, clothingId),
    enabled: wardrobeId.length > 0 && clothingId.length > 0,
    select: toClothing,
  });
}
