import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  createDynamoDbClientConfig,
  type TransactWriteItem,
} from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
export type OperationInput = {
  wardrobeId: string;
  date: string;
  templateId?: string | undefined;
  clothingIds?: string[] | undefined;
  expectedTemplateRevision?: number | undefined;
  operationId?: string | undefined;
};
export type OperationRecord = {
  historyId: string;
  payload: string;
  createdAt: number;
  deletedAt?: number;
};
export const operationKey = (wardrobeId: string, operationId: string) => ({
  PK: `W#${wardrobeId}#HISTORY_OP`,
  SK: operationId,
});
export const operationPayload = (input: OperationInput) =>
  JSON.stringify({
    date: input.date,
    ...(input.templateId
      ? { templateId: input.templateId }
      : { clothingIds: [...(input.clothingIds ?? [])].sort() }),
    ...(input.expectedTemplateRevision !== undefined
      ? { expectedTemplateRevision: input.expectedTemplateRevision }
      : {}),
  });
export function replayOperation(
  record: OperationRecord | undefined,
  input: OperationInput,
): { historyId: string; replayed: true } | undefined {
  if (!record) return undefined;
  if (record.payload !== operationPayload(input))
    throw createAppError("CONFLICT", {
      details: { reason: "IDEMPOTENCY_KEY_REUSED" },
    });
  if (record.deletedAt !== undefined)
    throw createAppError("CONFLICT", {
      details: { reason: "HISTORY_ALREADY_DELETED" },
    });
  return { historyId: record.historyId, replayed: true };
}
export function createOperationRepo() {
  const config = createDynamoDbClientConfig();
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: config.region,
      maxAttempts: 1,
      ...(config.endpoint
        ? {
            endpoint: config.endpoint,
            credentials: { accessKeyId: "local", secretAccessKey: "local" },
          }
        : {}),
    }),
    { marshallOptions: { removeUndefinedValues: true } },
  );
  return {
    async get(
      wardrobeId: string,
      operationId: string,
    ): Promise<OperationRecord | undefined> {
      return (
        await client.send(
          new GetCommand({
            TableName: config.tableName,
            Key: operationKey(wardrobeId, operationId),
            ConsistentRead: true,
          }),
        )
      ).Item as OperationRecord | undefined;
    },
    async write(items: TransactWriteItem[]) {
      return client.send(
        new TransactWriteCommand({
          TransactItems: items.map((item) =>
            Object.fromEntries(
              Object.entries(item).map(([kind, value]) => [
                kind,
                { ...value, TableName: config.tableName },
              ]),
            ),
          ) as ConstructorParameters<
            typeof TransactWriteCommand
          >[0]["TransactItems"],
        }),
      );
    },
  };
}
