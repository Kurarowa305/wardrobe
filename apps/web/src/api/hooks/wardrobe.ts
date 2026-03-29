import { useMutation } from "@tanstack/react-query";

import { createWardrobe } from "@/api/endpoints/wardrobe";
import { queryKeys } from "@/api/queryKeys";
import type { CreateWardrobeRequestDto } from "@/api/schemas/wardrobe";

export function useCreateWardrobeMutation() {
  return useMutation({
    mutationKey: queryKeys.wardrobe.all,
    mutationFn: (body: CreateWardrobeRequestDto) => createWardrobe(body),
  });
}
