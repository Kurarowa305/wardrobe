import type {
  CreateHistoryRequest,
  HistoryDetailClothingItem,
  HistoryDetailResponse,
  HistoryEntityShape,
  HistoryListClothingItem,
  HistoryListItem,
  HistoryListOrder,
  HistoryListParams,
  HistoryListResponse,
} from "../schema/historySchema.js";

export type HistoryListOrderDto = HistoryListOrder;
export type HistoryListParamsDto = HistoryListParams;
export type CreateHistoryRequestDto = CreateHistoryRequest;
export type HistoryListClothingItemDto = HistoryListClothingItem;
export type HistoryDetailClothingItemDto = HistoryDetailClothingItem;
export type HistoryListItemDto = HistoryListItem;
export type HistoryDetailResponseDto = HistoryDetailResponse;
export type HistoryListResponseDto = HistoryListResponse;

export type HistoryEntityDto = HistoryEntityShape;
export type HistoryDto = HistoryDetailResponseDto;
