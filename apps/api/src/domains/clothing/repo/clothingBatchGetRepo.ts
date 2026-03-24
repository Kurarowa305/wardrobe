import { createDynamoDbClient, type DynamoDbClient, type DynamoDbKey } from "../../../clients/dynamodb.js";
import { buildClothingBaseKey } from "./clothingKeys.js";

export const CLOTHING_BATCH_GET_CHUNK_SIZE = 80;

export type BatchGetClothingInput = {
  wardrobeId: string;
  clothingIds: string[];
  chunkSize?: number;
};

export type BatchGetClothingRepo = ReturnType<typeof createClothingBatchGetRepo>;

export function splitClothingIdsForBatchGet(clothingIds: string[], chunkSize = CLOTHING_BATCH_GET_CHUNK_SIZE): string[][] {
  if (chunkSize < 1) {
    throw new Error("chunkSize must be greater than 0");
  }

  const chunks: string[][] = [];
  for (let index = 0; index < clothingIds.length; index += chunkSize) {
    chunks.push(clothingIds.slice(index, index + chunkSize));
  }

  return chunks;
}

export function buildClothingBatchGetKeys(input: { wardrobeId: string; clothingIds: string[] }): DynamoDbKey[] {
  return input.clothingIds.map((clothingId) =>
    buildClothingBaseKey({
      wardrobeId: input.wardrobeId,
      clothingId,
    }),
  );
}

export function reorderClothingItemsByIds<TItem extends { clothingId: string }>(clothingIds: string[], items: TItem[]): TItem[] {
  const itemMap = new Map(items.map((item) => [item.clothingId, item]));

  return clothingIds
    .map((clothingId) => itemMap.get(clothingId))
    .filter((item): item is TItem => item !== undefined);
}

export function createClothingBatchGetRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async batchGetByIds(input: BatchGetClothingInput) {
      const chunks = splitClothingIdsForBatchGet(input.clothingIds, input.chunkSize);

      return Promise.all(
        chunks.map((chunk) =>
          client.batchGetItem({
            Keys: buildClothingBatchGetKeys({
              wardrobeId: input.wardrobeId,
              clothingIds: chunk,
            }),
            ConsistentRead: true,
          }),
        ),
      );
    },
  };
}
