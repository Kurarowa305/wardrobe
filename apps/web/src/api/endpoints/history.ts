import { apiClient } from "@/api/client";
import type {
  CreateHistoryRequestDto,
  HistoryDetailResponseDto,
  HistoryListParamsDto,
  HistoryListResponseDto,
} from "@/api/schemas/history";

function buildHistoryCollectionPath(wardrobeId: string) {
  return `/wardrobes/${wardrobeId}/histories`;
}

function buildHistoryDetailPath(wardrobeId: string, historyId: string) {
  return `${buildHistoryCollectionPath(wardrobeId)}/${historyId}`;
}

export function listHistories(
  wardrobeId: string,
  params: HistoryListParamsDto = {},
): Promise<HistoryListResponseDto> {
  return apiClient.get<HistoryListResponseDto>(buildHistoryCollectionPath(wardrobeId), {
    query: params,
  });
}

export function getHistory(wardrobeId: string, historyId: string): Promise<HistoryDetailResponseDto> {
  return apiClient.get<HistoryDetailResponseDto>(buildHistoryDetailPath(wardrobeId, historyId));
}

export function createHistory(wardrobeId: string, body: CreateHistoryRequestDto, operationId?: string): Promise<{ historyId: string }> {
  return apiClient.post<{ historyId: string }, CreateHistoryRequestDto>(buildHistoryCollectionPath(wardrobeId), {
    body,
    ...(operationId ? { headers: { "Idempotency-Key": operationId } } : {}),
  });
}

export function deleteHistory(wardrobeId: string, historyId: string): Promise<void> {
  return apiClient.delete<void>(buildHistoryDetailPath(wardrobeId, historyId));
}
