import { createDynamoDbClient, type DynamoDbClient, type DynamoDbKey } from "../../../clients/dynamodb.js";
import type { ClothingEntity, ClothingEntityKey } from "../entities/clothing.js";
import { buildClothingBaseKey, buildClothingIndexKeys, buildClothingStatusListPk } from "./clothingKeys.js";
import type { ClothingStatus } from "../schema/clothingSchema.js";

export const clothingListIndexNames = {
  createdAt: "StatusListByCreatedAt",
  wearCount: "StatusListByWearCount",
  lastWornAt: "StatusListByLastWornAt",
} as const;

export type ClothingListIndexName = typeof clothingListIndexNames[keyof typeof clothingListIndexNames];

export type ClothingItem = ClothingEntity & {
  PK: string;
  SK: string;
  statusListPk: string;
  createdAtSk: string;
  wearCountSk: string;
  lastWornAtSk: string;
};

export type CreateClothingInput = ClothingEntity;
export type UpdateClothingInput = ClothingEntity;
export type GetClothingInput = ClothingEntityKey;
export type DeleteClothingInput = ClothingEntityKey & { deletedAt: number };
export type ListClothingInput = {
  wardrobeId: string;
  indexName: ClothingListIndexName;
  status?: ClothingStatus;
  limit?: number;
  exclusiveStartKey?: DynamoDbKey;
  scanIndexForward?: boolean;
};

export type ClothingRepo = ReturnType<typeof createClothingRepo>;

export function buildClothingItem(entity: ClothingEntity): ClothingItem {
  return {
    ...entity,
    ...buildClothingIndexKeys(entity),
  };
}

export function buildClothingListKey(input: { wardrobeId: string; status?: ClothingStatus }) {
  return buildClothingStatusListPk({
    wardrobeId: input.wardrobeId,
    status: input.status ?? "ACTIVE",
  });
}

export function createClothingRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async create(input: CreateClothingInput) {
      return client.putItem({
        Item: buildClothingItem(input),
        ConditionExpression: "attribute_not_exists(PK)",
      });
    },
    async get(input: GetClothingInput) {
      return client.getItem({
        Key: buildClothingBaseKey(input),
        ConsistentRead: true,
      });
    },
    async list(input: ListClothingInput) {
      return client.query({
        IndexName: input.indexName,
        KeyConditionExpression: "#statusListPk = :statusListPk",
        ExpressionAttributeNames: {
          "#statusListPk": "statusListPk",
        },
        ExpressionAttributeValues: {
          ":statusListPk": buildClothingListKey(input),
        },
        ExclusiveStartKey: input.exclusiveStartKey,
        Limit: input.limit,
        ScanIndexForward: input.scanIndexForward,
      });
    },
    async update(input: UpdateClothingInput) {
      const item = buildClothingItem(input);

      return client.updateItem({
        Key: buildClothingBaseKey(input),
        UpdateExpression: [
          "SET #name = :name",
          "#genre = :genre",
          "imageKey = :imageKey",
          "#status = :status",
          "wearCount = :wearCount",
          "lastWornAt = :lastWornAt",
          "createdAt = :createdAt",
          "deletedAt = :deletedAt",
          "statusListPk = :statusListPk",
          "createdAtSk = :createdAtSk",
          "wearCountSk = :wearCountSk",
          "lastWornAtSk = :lastWornAtSk",
        ].join(", "),
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#name": "name",
          "#genre": "genre",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":name": item.name,
          ":genre": item.genre,
          ":imageKey": item.imageKey,
          ":status": item.status,
          ":wearCount": item.wearCount,
          ":lastWornAt": item.lastWornAt,
          ":createdAt": item.createdAt,
          ":deletedAt": item.deletedAt,
          ":statusListPk": item.statusListPk,
          ":createdAtSk": item.createdAtSk,
          ":wearCountSk": item.wearCountSk,
          ":lastWornAtSk": item.lastWornAtSk,
        },
        ReturnValues: "ALL_NEW",
      });
    },
    async delete(input: DeleteClothingInput) {
      return client.updateItem({
        Key: buildClothingBaseKey(input),
        UpdateExpression: "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "DELETED",
          ":deletedAt": input.deletedAt,
          ":statusListPk": buildClothingStatusListPk({
            wardrobeId: input.wardrobeId,
            status: "DELETED",
          }),
        },
        ReturnValues: "ALL_NEW",
      });
    },
  };
}
