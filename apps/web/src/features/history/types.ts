import type {
  HistoryDetailClothingItemDto,
  HistoryDetailResponseDto,
  HistoryListClothingItemDto,
  HistoryListItemDto,
} from "@/api/schemas/history";

export type HistoryInputType = "template" | "combination";

export type HistoryListClothingItem = {
  clothingId: string;
  name: string;
  imageKey: string | null;
  deleted: boolean;
};

export type HistoryListItem = {
  historyId: string;
  date: string;
  inputType: HistoryInputType;
  name: string | null;
  clothingItems: HistoryListClothingItem[];
};

export type HistoryClothingItem = {
  clothingId: string;
  name: string;
  imageKey: string | null;
  wearCount: number;
  lastWornAt: number | null;
  deleted: boolean;
};

export type History = {
  date: string;
  inputType: HistoryInputType;
  templateName: string | null;
  clothingItems: HistoryClothingItem[];
};

function resolveHistoryInputType(name: string | null): HistoryInputType {
  return name === null ? "combination" : "template";
}

export function toHistoryListClothingItem(dto: HistoryListClothingItemDto): HistoryListClothingItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    imageKey: dto.imageKey,
    deleted: dto.status === "DELETED",
  };
}

export function toHistoryListItem(dto: HistoryListItemDto): HistoryListItem {
  return {
    historyId: dto.historyId,
    date: dto.date,
    inputType: resolveHistoryInputType(dto.name),
    name: dto.name,
    clothingItems: dto.clothingItems.map(toHistoryListClothingItem),
  };
}

export function toHistoryClothingItem(dto: HistoryDetailClothingItemDto): HistoryClothingItem {
  return {
    clothingId: dto.clothingId,
    name: dto.name,
    imageKey: dto.imageKey,
    wearCount: dto.wearCount,
    lastWornAt: dto.lastWornAt > 0 ? dto.lastWornAt : null,
    deleted: dto.status === "DELETED",
  };
}

export function toHistory(dto: HistoryDetailResponseDto): History {
  return {
    date: dto.date,
    inputType: resolveHistoryInputType(dto.templateName),
    templateName: dto.templateName,
    clothingItems: dto.clothingItems.map(toHistoryClothingItem),
  };
}
