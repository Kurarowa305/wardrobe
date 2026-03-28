import type { StatsWriteTargetFact } from "./types.js";

const DAILY_COUNTER_PREFIX = "COUNT";
const CLOTHING_SEGMENT = "CLOTH";
const TEMPLATE_SEGMENT = "TPL";
const DATE_PREFIX = "DATE";

export type HistoryStatsDateKeyInput = {
  date: string;
};

export type WearDailyPartitionKeyInput = {
  wardrobeId: string;
  target: StatsWriteTargetFact;
};

const resolveTargetSegment = (target: StatsWriteTargetFact): string => {
  return target.kind === "clothing" ? CLOTHING_SEGMENT : TEMPLATE_SEGMENT;
};

export const buildHistoryStatsDateKey = (input: HistoryStatsDateKeyInput): string => {
  return `${DATE_PREFIX}#${input.date}`;
};

export const buildWearDailyPartitionKey = (
  input: WearDailyPartitionKeyInput,
): string => {
  const segment = resolveTargetSegment(input.target);
  return `W#${input.wardrobeId}#${DAILY_COUNTER_PREFIX}#${segment}#${input.target.id}`;
};

export const buildWearDailyKey = (
  input: WearDailyPartitionKeyInput & HistoryStatsDateKeyInput,
) => {
  return {
    PK: buildWearDailyPartitionKey(input),
    SK: buildHistoryStatsDateKey({ date: input.date }),
  };
};
