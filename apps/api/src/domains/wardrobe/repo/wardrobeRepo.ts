import { createDynamoDbClient, type DynamoDbClient } from "../../../clients/dynamodb.js";

const WARDROBE_META_SK = "META";

export type WardrobeMetaItem = {
  PK: string;
  SK: typeof WARDROBE_META_SK;
  wardrobeId: string;
  name: string;
  createdAt: number;
};

export type CreateWardrobeInput = {
  wardrobeId: string;
  name: string;
  createdAt: number;
};

export type GetWardrobeInput = {
  wardrobeId: string;
};

export type WardrobeRepo = ReturnType<typeof createWardrobeRepo>;

export function buildWardrobeMetaKey(wardrobeId: string) {
  return {
    PK: `W#${wardrobeId}`,
    SK: WARDROBE_META_SK,
  } as const;
}

export function buildWardrobeMetaItem(input: CreateWardrobeInput): WardrobeMetaItem {
  return {
    ...buildWardrobeMetaKey(input.wardrobeId),
    wardrobeId: input.wardrobeId,
    name: input.name,
    createdAt: input.createdAt,
  };
}

export function createWardrobeRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async create(input: CreateWardrobeInput) {
      const item = buildWardrobeMetaItem(input);

      return client.putItem({
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
      });
    },
    async get(input: GetWardrobeInput) {
      return client.getItem({
        Key: buildWardrobeMetaKey(input.wardrobeId),
        ConsistentRead: true,
      });
    },
  };
}
