import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDynamoDbClientConfig } from "../../../clients/dynamodb.js";
import { buildClothingBaseKey } from "../../clothing/repo/clothingKeys.js";
export type RecommendationTemplate = {
  templateId: string;
  name: string;
  status: string;
  clothingIds: string[];
  tagIds?: string[];
  createdAt: number;
  revision?: number;
};
export type RecommendationClothing = {
  clothingId: string;
  imageKey?: string | null;
  status: string;
  lastWornAt?: number;
};
export type RecommendationRepository = {
  readTemplates(
    wardrobeId: string,
    cursor: Record<string, unknown> | undefined,
    signal: AbortSignal,
  ): Promise<{
    items: RecommendationTemplate[];
    cursor?: Record<string, unknown>;
  }>;
  readClothing(
    wardrobeId: string,
    ids: string[],
    signal: AbortSignal,
  ): Promise<{ items: RecommendationClothing[]; unprocessed: boolean }>;
};
export function createRecommendationRepository(): RecommendationRepository {
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
  );
  return {
    async readTemplates(wardrobeId, cursor, signal) {
      const result = await client.send(
        new QueryCommand({
          TableName: config.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": `W#${wardrobeId}#TPL` },
          ConsistentRead: true,
          ...(cursor ? { ExclusiveStartKey: cursor } : {}),
        }),
        { abortSignal: signal },
      );
      return {
        items: (result.Items ?? []) as RecommendationTemplate[],
        ...(result.LastEvaluatedKey ? { cursor: result.LastEvaluatedKey } : {}),
      };
    },
    async readClothing(wardrobeId, ids, signal) {
      const result = await client.send(
        new BatchGetCommand({
          RequestItems: {
            [config.tableName]: {
              Keys: ids.map((clothingId) =>
                buildClothingBaseKey({ wardrobeId, clothingId }),
              ),
              ConsistentRead: true,
            },
          },
        }),
        { abortSignal: signal },
      );
      return {
        items: (result.Responses?.[config.tableName] ??
          []) as RecommendationClothing[],
        unprocessed: Object.values(result.UnprocessedKeys ?? {}).some(
          (value) => (value.Keys?.length ?? 0) > 0,
        ),
      };
    },
  };
}
