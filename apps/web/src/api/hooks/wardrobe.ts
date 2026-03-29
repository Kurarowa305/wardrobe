import { useMutation, useQuery } from "@tanstack/react-query";
import { createWardrobe, getWardrobe } from "@/api/endpoints/wardrobe";
import { queryKeys } from "@/api/queryKeys";
import type { CreateWardrobeRequestDto } from "@/api/schemas/wardrobe";

export function useCreateWardrobeMutation() {
  return useMutation({
    mutationKey: queryKeys.wardrobe.all,
    mutationFn: (body: CreateWardrobeRequestDto) => createWardrobe(body),
  });
}

export function useWardrobe(wardrobeId: string) {
  return useQuery({
    queryKey: queryKeys.wardrobe.detail(wardrobeId),
    queryFn: () => getWardrobe(wardrobeId),
    enabled: wardrobeId.length > 0,
  });
}
