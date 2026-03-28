import { buildHistoryStatsDateKey } from "../keys.js";

export type LastWornAtRecomputeTarget = {
  wardrobeId: string;
  target: {
    kind: "clothing" | "template";
    id: string;
  };
};

export type LastWornAtRecomputeQueryInput = LastWornAtRecomputeTarget & {
  beforeDate: string;
};

export type LastWornAtRecomputeQueryResult = {
  date: string;
} | null;

export type LastWornAtRecomputeQuery = (
  input: LastWornAtRecomputeQueryInput,
) => Promise<LastWornAtRecomputeQueryResult>;

export type LastWornAtRecomputeInput = LastWornAtRecomputeTarget & {
  deletedDate: string;
  currentLastWornAt: number;
  findLatestBeforeDate: LastWornAtRecomputeQuery;
};

const DATE_PATTERN = /^\d{8}$/;

const toEpochMsFromCompactDate = (date: string): number => {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid yyyymmdd date: ${date}`);
  }

  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(4, 6), 10);
  const day = Number.parseInt(date.slice(6, 8), 10);

  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
};

const shouldRecompute = (input: LastWornAtRecomputeInput): boolean => {
  return toEpochMsFromCompactDate(input.deletedDate) === input.currentLastWornAt;
};

export const buildRecomputeCursor = (date: string): string => {
  return buildHistoryStatsDateKey({ date });
};

export const recomputeLastWornAt = async (
  input: LastWornAtRecomputeInput,
): Promise<number> => {
  if (!shouldRecompute(input)) {
    return input.currentLastWornAt;
  }

  const previousDaily = await input.findLatestBeforeDate({
    wardrobeId: input.wardrobeId,
    target: input.target,
    beforeDate: input.deletedDate,
  });

  if (previousDaily === null) {
    return 0;
  }

  return toEpochMsFromCompactDate(previousDaily.date);
};
