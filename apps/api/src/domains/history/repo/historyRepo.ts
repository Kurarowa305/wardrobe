import { createDynamoDbClient, type DynamoDbClient, type DynamoDbKey } from "../../../clients/dynamodb.js";
import type { HistoryEntity, HistoryEntityKey } from "../entities/history.js";
import type { HistoryListOrder } from "../schema/historySchema.js";
import { buildHistoryBaseKey, buildHistoryDateSk, buildHistoryIndexKeys } from "./historyKeys.js";

export const historyListIndexName = "HistoryByDate";

const HISTORY_MIN_DATE = "00000000";
const HISTORY_MAX_DATE = "99999999";

export type HistoryItem = HistoryEntity & {
  PK: string;
  SK: string;
  historyDateSk: string;
};

export type GetHistoryInput = HistoryEntityKey;
export type DeleteHistoryInput = HistoryEntityKey;

export type ListHistoryInput = {
  wardrobeId: string;
  from?: string;
  to?: string;
  order?: HistoryListOrder;
  limit?: number;
  exclusiveStartKey?: DynamoDbKey;
};

export type HistoryRepo = ReturnType<typeof createHistoryRepo>;

export function buildHistoryItem(entity: HistoryEntity): HistoryItem {
  return {
    ...entity,
    ...buildHistoryIndexKeys(entity),
  };
}

export function buildHistoryDateRange(input: { from?: string | undefined; to?: string | undefined }) {
  const from = input.from ?? HISTORY_MIN_DATE;
  const to = input.to ?? HISTORY_MAX_DATE;

  return {
    fromDateSk: buildHistoryDateSk({
      date: from,
      historyId: "",
    }),
    toDateSk: buildHistoryDateSk({
      date: to,
      historyId: "~",
    }),
  };
}

export function buildHistoryPartitionKey(input: { wardrobeId: string }) {
  return `W#${input.wardrobeId}#HIST`;
}

export function createHistoryRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async get(input: GetHistoryInput) {
      return client.getItem({
        Key: buildHistoryBaseKey(input),
        ConsistentRead: true,
      });
    },
    async list(input: ListHistoryInput) {
      const dateRange = buildHistoryDateRange({
        from: input.from,
        to: input.to,
      });

      return client.query({
        IndexName: historyListIndexName,
        KeyConditionExpression: "#PK = :PK AND #historyDateSk BETWEEN :fromDateSk AND :toDateSk",
        ExpressionAttributeNames: {
          "#PK": "PK",
          "#historyDateSk": "historyDateSk",
        },
        ExpressionAttributeValues: {
          ":PK": buildHistoryPartitionKey({ wardrobeId: input.wardrobeId }),
          ":fromDateSk": dateRange.fromDateSk,
          ":toDateSk": dateRange.toDateSk,
        },
        ExclusiveStartKey: input.exclusiveStartKey,
        Limit: input.limit,
        ScanIndexForward: input.order === "asc",
      });
    },
    async delete(input: DeleteHistoryInput) {
      return client.transactWriteItems({
        TransactItems: [
          {
            Delete: {
              Key: buildHistoryBaseKey(input),
              ConditionExpression: "attribute_exists(PK)",
            },
          },
        ],
      });
    },
  };
}
