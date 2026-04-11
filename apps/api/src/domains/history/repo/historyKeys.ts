import type { HistoryEntityKey } from "../entities/history.js";

const HISTORY_PARTITION_SEGMENT = "HIST";
const DATE_SORT_PREFIX = "DATE";

export type HistoryBaseKey = {
  PK: string;
  SK: string;
};

export type HistoryDateSortKeyInput = {
  date: string;
  historyId: string;
};

export function buildHistoryBaseKey(input: HistoryEntityKey): HistoryBaseKey {
  return {
    PK: `W#${input.wardrobeId}#${HISTORY_PARTITION_SEGMENT}`,
    SK: `HIST#${input.historyId}`,
  };
}

export function buildHistoryDateSk(input: HistoryDateSortKeyInput): string {
  return `${DATE_SORT_PREFIX}#${input.date}#${input.historyId}`;
}

export function buildHistoryIndexKeys(input: HistoryEntityKey & { date: string }) {
  return {
    ...buildHistoryBaseKey(input),
    historyDateSk: buildHistoryDateSk({ date: input.date, historyId: input.historyId }),
  };
}
