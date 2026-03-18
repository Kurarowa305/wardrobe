import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHistory,
  deleteHistory,
  getHistory,
  listHistories,
} from "@/api/endpoints/history";
import { queryKeys } from "@/api/queryKeys";
import type {
  CreateHistoryRequestDto,
  HistoryListParamsDto,
} from "@/api/schemas/history";
import { toHistory, toHistoryListItem } from "@/features/history/types";

const HISTORY_LIST_STALE_TIME_MS = 60_000;
const RECENT_HISTORY_LIMIT = 5;

type HistoryIdentity = {
  wardrobeId: string;
  historyId: string;
};

async function invalidateHistoryQueries(queryClient: QueryClient, wardrobeId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.history.byWardrobe(wardrobeId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.clothing.byWardrobe(wardrobeId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.template.byWardrobe(wardrobeId),
    }),
  ]);
}

async function invalidateHistoryDetailQuery(
  queryClient: QueryClient,
  { wardrobeId, historyId }: HistoryIdentity,
) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.history.detail(wardrobeId, historyId),
  });
}

export function useHistoryList(wardrobeId: string, params: HistoryListParamsDto = {}) {
  return useQuery({
    queryKey: queryKeys.history.list(wardrobeId, params),
    queryFn: () => listHistories(wardrobeId, params),
    staleTime: HISTORY_LIST_STALE_TIME_MS,
    enabled: wardrobeId.length > 0,
    select: (response) => ({
      items: response.items.map(toHistoryListItem),
      nextCursor: response.nextCursor,
    }),
  });
}

export function useRecentHistories(wardrobeId: string, limit = RECENT_HISTORY_LIMIT) {
  return useHistoryList(wardrobeId, {
    order: "desc",
    limit,
  });
}

export function useHistory(wardrobeId: string, historyId: string) {
  return useQuery({
    queryKey: queryKeys.history.detail(wardrobeId, historyId),
    queryFn: () => getHistory(wardrobeId, historyId),
    enabled: wardrobeId.length > 0 && historyId.length > 0,
    select: toHistory,
  });
}

export function useCreateHistoryMutation(wardrobeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.history.byWardrobe(wardrobeId),
    mutationFn: (body: CreateHistoryRequestDto) => createHistory(wardrobeId, body),
    onSuccess: async () => {
      await invalidateHistoryQueries(queryClient, wardrobeId);
    },
  });
}

export function useDeleteHistoryMutation(wardrobeId: string, historyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.history.detail(wardrobeId, historyId),
    mutationFn: () => deleteHistory(wardrobeId, historyId),
    onSuccess: async () => {
      await Promise.all([
        invalidateHistoryDetailQuery(queryClient, { wardrobeId, historyId }),
        invalidateHistoryQueries(queryClient, wardrobeId),
      ]);
    },
  });
}
