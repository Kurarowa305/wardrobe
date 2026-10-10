import { createDynamoDbClient, type DynamoDbClient } from "../../../../clients/dynamodb.js";
import { buildClothingBaseKey, buildClothingLastWornAtSk, buildClothingWearCountSk } from "../../../clothing/repo/clothingKeys.js";

export type UpdateClothingStatsInput = {
  wardrobeId: string;
  clothingId: string;
  wearCount: number;
  lastWornAt: number;
};

export type ClothingStatsRepo = ReturnType<typeof createClothingStatsRepo>;

export function buildClothingStatsSortKeys(input: {
  clothingId: string;
  wearCount: number;
  lastWornAt: number;
}) {
  return {
    wearCountSk: buildClothingWearCountSk({
      clothingId: input.clothingId,
      value: input.wearCount,
    }),
    lastWornAtSk: buildClothingLastWornAtSk({
      clothingId: input.clothingId,
      value: input.lastWornAt,
    }),
  };
}

export function createClothingStatsRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async updateStats(input: UpdateClothingStatsInput) {
      const sortKeys = buildClothingStatsSortKeys(input);

      return client.updateItem({
        Key: buildClothingBaseKey(input),
        UpdateExpression:
          "SET wearCount = :wearCount, lastWornAt = :lastWornAt, wearCountSk = :wearCountSk, lastWornAtSk = :lastWornAtSk, statsVersion = if_not_exists(statsVersion, :zero) + :one",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":one": 1,
          ":wearCount": input.wearCount,
          ":lastWornAt": input.lastWornAt,
          ":wearCountSk": sortKeys.wearCountSk,
          ":lastWornAtSk": sortKeys.lastWornAtSk,
        },
        ReturnValues: "ALL_NEW",
      });
    },
  };
}
