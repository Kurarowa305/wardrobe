import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createClothing,
  deleteClothing,
  getClothing,
  listClothings,
  updateClothing,
} from "@/api/endpoints/clothing";
import { queryKeys } from "@/api/queryKeys";
import type {
  ClothingListParamsDto,
  CreateClothingRequestDto,
  UpdateClothingRequestDto,
} from "@/api/schemas/clothing";
import { toClothing, toClothingListItem } from "@/features/clothing/types";

const CLOTHING_LIST_STALE_TIME_MS = 60_000;

type ClothingIdentity = {
  wardrobeId: string;
  clothingId: string;
};

async function invalidateClothingListQueries(queryClient: QueryClient, wardrobeId: string) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.clothing.lists(wardrobeId),
  });
}

async function invalidateClothingRelatedQueries(
  queryClient: QueryClient,
  { wardrobeId, clothingId }: ClothingIdentity,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.clothing.detail(wardrobeId, clothingId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.clothing.lists(wardrobeId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.template.byWardrobe(wardrobeId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.history.byWardrobe(wardrobeId),
    }),
  ]);
}

export function useClothingList(wardrobeId: string, params: ClothingListParamsDto = {}) {
  return useQuery({
    queryKey: queryKeys.clothing.list(wardrobeId, params),
    queryFn: () => listClothings(wardrobeId, params),
    staleTime: CLOTHING_LIST_STALE_TIME_MS,
    enabled: wardrobeId.length > 0,
    select: (response) => ({
      items: response.items.map(toClothingListItem),
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

export function useCreateClothingMutation(wardrobeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.clothing.byWardrobe(wardrobeId),
    mutationFn: (body: CreateClothingRequestDto) => createClothing(wardrobeId, body),
    onSuccess: async () => {
      await invalidateClothingListQueries(queryClient, wardrobeId);
    },
  });
}

export function useUpdateClothingMutation(wardrobeId: string, clothingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.clothing.detail(wardrobeId, clothingId),
    mutationFn: (body: UpdateClothingRequestDto) => updateClothing(wardrobeId, clothingId, body),
    onSuccess: async () => {
      await invalidateClothingRelatedQueries(queryClient, { wardrobeId, clothingId });
    },
  });
}

export function useDeleteClothingMutation(wardrobeId: string, clothingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.clothing.detail(wardrobeId, clothingId),
    mutationFn: () => deleteClothing(wardrobeId, clothingId),
    onSuccess: async () => {
      await invalidateClothingRelatedQueries(queryClient, { wardrobeId, clothingId });
    },
  });
}
