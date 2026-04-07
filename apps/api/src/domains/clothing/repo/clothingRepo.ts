import { createDynamoDbClient, type DynamoDbClient, type DynamoDbKey } from "../../../clients/dynamodb.js";
import type { ClothingEntity, ClothingEntityKey } from "../entities/clothing.js";
import {
  buildClothingBaseKey,
  buildClothingIndexKeys,
  buildClothingStatusGenreListPk,
  buildClothingStatusListPk,
} from "./clothingKeys.js";
import type { ClothingGenre, ClothingStatus } from "../schema/clothingSchema.js";

export const clothingListIndexNames = {
  createdAt: "StatusListByCreatedAt",
  statusGenreCreatedAt: "StatusGenreListByCreatedAt",
  wearCount: "StatusListByWearCount",
  lastWornAt: "StatusListByLastWornAt",
} as const;

export type ClothingListIndexName = typeof clothingListIndexNames[keyof typeof clothingListIndexNames];

export type ClothingItem = ClothingEntity & {
  PK: string;
  SK: string;
  statusListPk: string;
  statusGenreListPk: string;
  createdAtSk: string;
  wearCountSk: string;
  lastWornAtSk: string;
};

export type CreateClothingInput = ClothingEntity;
export type UpdateClothingInput = ClothingEntity;
export type GetClothingInput = ClothingEntityKey;
export type DeleteClothingInput = ClothingEntityKey & { deletedAt: number; genre: ClothingGenre };
export type ListClothingInput = {
  wardrobeId: string;
  indexName: ClothingListIndexName;
  status?: ClothingStatus;
  genre?: ClothingGenre;
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

export function buildClothingGenreListKey(input: {
  wardrobeId: string;
  status?: ClothingStatus;
  genre: ClothingGenre;
}) {
  return buildClothingStatusGenreListPk({
    wardrobeId: input.wardrobeId,
    status: input.status ?? "ACTIVE",
    genre: input.genre,
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
      if (input.indexName === clothingListIndexNames.statusGenreCreatedAt) {
        if (!input.genre) {
          throw new Error("genre is required when querying StatusGenreListByCreatedAt");
        }

        return client.query({
          IndexName: input.indexName,
          KeyConditionExpression: "#statusGenreListPk = :statusGenreListPk",
          ExpressionAttributeNames: { "#statusGenreListPk": "statusGenreListPk" },
          ExpressionAttributeValues: {
            ":statusGenreListPk": buildClothingGenreListKey({
              wardrobeId: input.wardrobeId,
              ...(input.status !== undefined ? { status: input.status } : {}),
              genre: input.genre,
            }),
          },
          ExclusiveStartKey: input.exclusiveStartKey,
          Limit: input.limit,
          ScanIndexForward: input.scanIndexForward,
        });
      }

      return client.query({
        IndexName: input.indexName,
        KeyConditionExpression: "#statusListPk = :statusListPk",
        ExpressionAttributeNames: { "#statusListPk": "statusListPk" },
        ExpressionAttributeValues: { ":statusListPk": buildClothingListKey(input) },
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
          "statusGenreListPk = :statusGenreListPk",
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
          ":statusGenreListPk": item.statusGenreListPk,
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
        UpdateExpression: "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk, statusGenreListPk = :statusGenreListPk",
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
          ":statusGenreListPk": buildClothingStatusGenreListPk({
            wardrobeId: input.wardrobeId,
            status: "DELETED",
            genre: input.genre,
          }),
        },
        ReturnValues: "ALL_NEW",
      });
    },
  };
}
