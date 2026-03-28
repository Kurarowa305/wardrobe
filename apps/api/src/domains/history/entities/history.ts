import type { HistoryEntityShape } from "../schema/historySchema.js";

export type HistoryEntity = HistoryEntityShape;

export type HistoryEntityKey = {
  wardrobeId: string;
  historyId: string;
};

export type HistoryCoreAttributes = {
  date: string;
  templateId: string | null;
  clothingIds: string[];
  createdAt: number;
};

export type CreateHistoryEntityInput = HistoryEntityKey & HistoryCoreAttributes;

export function createHistoryEntity(input: CreateHistoryEntityInput): HistoryEntity {
  return {
    wardrobeId: input.wardrobeId,
    historyId: input.historyId,
    date: input.date,
    templateId: input.templateId,
    clothingIds: input.clothingIds,
    createdAt: input.createdAt,
  };
}
