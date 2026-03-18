import type { ClothingDto } from "@/api/schemas/clothing";

export type HistoryListOrderDto = "asc" | "desc";

export type HistoryListParamsDto = {
  from?: string | null;
  to?: string | null;
  order?: HistoryListOrderDto;
  limit?: number;
  cursor?: string | null;
};

export type CreateHistoryRequestDto =
  | {
      date: string;
      templateId: string;
      clothingIds?: never;
    }
  | {
      date: string;
      templateId?: never;
      clothingIds: string[];
    };

export type HistoryListClothingItemDto = Pick<
  ClothingDto,
  "clothingId" | "name" | "imageKey" | "status"
>;

export type HistoryListItemDto = {
  historyId: string;
  date: string;
  name: string | null;
  clothingItems: HistoryListClothingItemDto[];
};

export type HistoryDetailClothingItemDto = Pick<
  ClothingDto,
  "clothingId" | "name" | "imageKey" | "status" | "wearCount" | "lastWornAt"
>;

export type HistoryDto = {
  date: string;
  templateName: string | null;
  clothingItems: HistoryDetailClothingItemDto[];
};

export type HistoryListResponseDto = {
  items: HistoryListItemDto[];
  nextCursor: string | null;
};

export type HistoryDetailResponseDto = HistoryDto;

