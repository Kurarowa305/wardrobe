import { createDynamoDbClient, type DynamoDbClient, type DynamoDbKey } from "../../../clients/dynamodb.js";
import type { TemplateEntity, TemplateEntityKey } from "../entities/template.js";
import { buildTemplateBaseKey, buildTemplateIndexKeys, buildTemplateStatusListPk } from "./templateKeys.js";
import type { TemplateStatus } from "../schema/templateSchema.js";

export const templateListIndexNames = {
  createdAt: "StatusListByCreatedAt",
  wearCount: "StatusListByWearCount",
  lastWornAt: "StatusListByLastWornAt",
} as const;

export type TemplateListIndexName = typeof templateListIndexNames[keyof typeof templateListIndexNames];

export type TemplateItem = TemplateEntity & {
  PK: string;
  SK: string;
  statusListPk: string;
  createdAtSk: string;
  wearCountSk: string;
  lastWornAtSk: string;
};

export type CreateTemplateInput = TemplateEntity;
export type UpdateTemplateInput = TemplateEntity;
export type GetTemplateInput = TemplateEntityKey;
export type DeleteTemplateInput = TemplateEntityKey & { deletedAt: number };
export type ListTemplateInput = {
  wardrobeId: string;
  indexName: TemplateListIndexName;
  status?: TemplateStatus;
  limit?: number;
  exclusiveStartKey?: DynamoDbKey;
  scanIndexForward?: boolean;
};

export type TemplateRepo = ReturnType<typeof createTemplateRepo>;

export function buildTemplateItem(entity: TemplateEntity): TemplateItem {
  return {
    ...entity,
    ...buildTemplateIndexKeys(entity),
  };
}

export function buildTemplateListKey(input: { wardrobeId: string; status?: TemplateStatus }) {
  return buildTemplateStatusListPk({
    wardrobeId: input.wardrobeId,
    status: input.status ?? "ACTIVE",
  });
}

export function createTemplateRepo(client: DynamoDbClient = createDynamoDbClient()) {
  return {
    client,
    async create(input: CreateTemplateInput) {
      return client.putItem({
        Item: buildTemplateItem(input),
        ConditionExpression: "attribute_not_exists(PK)",
      });
    },
    async get(input: GetTemplateInput) {
      return client.getItem({
        Key: buildTemplateBaseKey(input),
        ConsistentRead: true,
      });
    },
    async list(input: ListTemplateInput) {
      return client.query({
        IndexName: input.indexName,
        KeyConditionExpression: "#statusListPk = :statusListPk",
        ExpressionAttributeNames: {
          "#statusListPk": "statusListPk",
        },
        ExpressionAttributeValues: {
          ":statusListPk": buildTemplateListKey(input),
        },
        ExclusiveStartKey: input.exclusiveStartKey,
        Limit: input.limit,
        ScanIndexForward: input.scanIndexForward,
      });
    },
    async update(input: UpdateTemplateInput) {
      const item = buildTemplateItem(input);

      return client.updateItem({
        Key: buildTemplateBaseKey(input),
        UpdateExpression: [
          "SET #name = :name",
          "#status = :status",
          "clothingIds = :clothingIds",
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
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":name": item.name,
          ":status": item.status,
          ":clothingIds": item.clothingIds,
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
    async delete(input: DeleteTemplateInput) {
      return client.updateItem({
        Key: buildTemplateBaseKey(input),
        UpdateExpression: "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "DELETED",
          ":deletedAt": input.deletedAt,
          ":statusListPk": buildTemplateStatusListPk({
            wardrobeId: input.wardrobeId,
            status: "DELETED",
          }),
        },
        ReturnValues: "ALL_NEW",
      });
    },
  };
}
