import { createDynamoDbClient, type DynamoDbClient } from "../../../../clients/dynamodb.js";
import { buildHistoryStatsDateKey, buildWearDailyPartitionKey } from "../keys.js";

export type WearDailyQueryTarget = {
  wardrobeId: string;
  target: {
    kind: "clothing" | "template";
    id: string;
  };
};

export type WearDailyLatestBeforeDateInput = WearDailyQueryTarget & {
  beforeDate: string;
};

export type WearDailyLatestBeforeDateResult = {
  date: string;
} | null;

const DATE_KEY_PREFIX = "DATE#";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const extractItems = (result: unknown): unknown[] => {
  if (!isRecord(result)) {
    return [];
  }

  const items = result.Items ?? result.items;
  return Array.isArray(items) ? items : [];
};

export const extractDateFromWearDailySk = (sk: string): string | null => {
  if (!sk.startsWith(DATE_KEY_PREFIX)) {
    return null;
  }

  return sk.slice(DATE_KEY_PREFIX.length);
};

export function createWearDailyQueryRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async findLatestBeforeDate(input: WearDailyLatestBeforeDateInput): Promise<WearDailyLatestBeforeDateResult> {
      const result = await client.query({
        KeyConditionExpression: "#PK = :PK AND #SK < :beforeDateSk",
        ExpressionAttributeNames: {
          "#PK": "PK",
          "#SK": "SK",
        },
        ExpressionAttributeValues: {
          ":PK": buildWearDailyPartitionKey(input),
          ":beforeDateSk": buildHistoryStatsDateKey({ date: input.beforeDate }),
        },
        ScanIndexForward: false,
        Limit: 1,
      });

      const firstItem = extractItems(result)[0];
      if (!isRecord(firstItem) || typeof firstItem.SK !== "string") {
        return null;
      }

      const date = extractDateFromWearDailySk(firstItem.SK);
      if (date === null || date.length === 0) {
        return null;
      }

      return { date };
    },
  };
}
