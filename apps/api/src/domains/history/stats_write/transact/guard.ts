import type { TransactWriteItem } from "../../../../clients/dynamodb.js";

export const HISTORY_STATS_WRITE_LIMIT = 25;

export type HistoryStatsWriteGuardInput = {
  itemCount: number;
  limit?: number | undefined;
};

export const assertHistoryStatsWriteWithinLimit = (input: HistoryStatsWriteGuardInput): void => {
  const limit = input.limit ?? HISTORY_STATS_WRITE_LIMIT;

  if (input.itemCount > limit) {
    throw new Error(`history stats write transact items exceed limit: ${input.itemCount} > ${limit}`);
  }
};

export const assertHistoryStatsWriteItemsWithinLimit = (
  items: TransactWriteItem[],
  limit?: number | undefined,
): void => {
  assertHistoryStatsWriteWithinLimit({
    itemCount: items.length,
    limit,
  });
};
