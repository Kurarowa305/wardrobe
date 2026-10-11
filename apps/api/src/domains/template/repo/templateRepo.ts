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
export type UpdateTemplateInput = TemplateEntity & { expectedRevision?: number };
export type GetTemplateInput = TemplateEntityKey;
export type DeleteTemplateInput = TemplateEntityKey & { deletedAt: number; expectedRevision?: number };
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

function revisionCondition(revision: number) {
  return `attribute_exists(PK) AND #status = :active AND ${revision === 0 ? '(attribute_not_exists(#revision) OR #revision = :expectedRevision)' : '#revision = :expectedRevision'}`;
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
          "#revision = :revision",
          "#status = :status",
          "clothingIds = :clothingIds",
          "tagIds = :tagIds",
          "createdAt = :createdAt",
          "deletedAt = :deletedAt",
          "statusListPk = :statusListPk",
          "createdAtSk = :createdAtSk",
        ].join(", "),
        ConditionExpression: revisionCondition(input.expectedRevision ?? 0),
        ExpressionAttributeNames: {
          "#name": "name",
          "#status": "status",
          "#revision": "revision",
        },
        ExpressionAttributeValues: {
          ":revision": item.revision ?? 0,
          ":expectedRevision": input.expectedRevision ?? 0,
          ":active": "ACTIVE",
          ":name": item.name,
          ":status": item.status,
          ":clothingIds": item.clothingIds,
          ":tagIds": item.tagIds,
          ":createdAt": item.createdAt,
          ":deletedAt": item.deletedAt,
          ":statusListPk": item.statusListPk,
          ":createdAtSk": item.createdAtSk,
        },
        ReturnValues: "ALL_NEW",
      });
    },
    async delete(input: DeleteTemplateInput) {
      return client.updateItem({
        Key: buildTemplateBaseKey(input),
        UpdateExpression: "SET #status = :status, deletedAt = :deletedAt, statusListPk = :statusListPk, #revision = :revision",
        ConditionExpression: revisionCondition(input.expectedRevision ?? 0),
        ExpressionAttributeNames: {
          "#status": "status",
          "#revision": "revision",
        },
        ExpressionAttributeValues: {
          ":revision": (input.expectedRevision ?? 0) + 1,
          ":expectedRevision": input.expectedRevision ?? 0,
          ":active": "ACTIVE",
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
