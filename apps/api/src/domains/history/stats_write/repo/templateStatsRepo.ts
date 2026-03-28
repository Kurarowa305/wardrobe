import { createDynamoDbClient, type DynamoDbClient } from "../../../../clients/dynamodb.js";
import { buildTemplateBaseKey, buildTemplateLastWornAtSk, buildTemplateWearCountSk } from "../../../template/repo/templateKeys.js";

export type UpdateTemplateStatsInput = {
  wardrobeId: string;
  templateId: string;
  wearCount: number;
  lastWornAt: number;
};

export type TemplateStatsRepo = ReturnType<typeof createTemplateStatsRepo>;

export function buildTemplateStatsSortKeys(input: {
  templateId: string;
  wearCount: number;
  lastWornAt: number;
}) {
  return {
    wearCountSk: buildTemplateWearCountSk({
      templateId: input.templateId,
      value: input.wearCount,
    }),
    lastWornAtSk: buildTemplateLastWornAtSk({
      templateId: input.templateId,
      value: input.lastWornAt,
    }),
  };
}

export function createTemplateStatsRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async updateStats(input: UpdateTemplateStatsInput) {
      const sortKeys = buildTemplateStatsSortKeys(input);

      return client.updateItem({
        Key: buildTemplateBaseKey(input),
        UpdateExpression:
          "SET wearCount = :wearCount, lastWornAt = :lastWornAt, wearCountSk = :wearCountSk, lastWornAtSk = :lastWornAtSk",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: {
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
