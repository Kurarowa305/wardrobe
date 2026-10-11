import { createDynamoDbClient } from "../../../clients/dynamodb.js";
import { createAppError } from "../../../core/errors/index.js";
import { buildWardrobeMetaKey } from "../../wardrobe/repo/wardrobeRepo.js";
import type { StoredRegion } from "../dictionary.js";
export type RegionMeta = {
  regionRevision?: number;
  region?: StoredRegion | null;
};
export type RegionRepo = {
  get(wardrobeId: string): Promise<RegionMeta | undefined>;
  save(
    wardrobeId: string,
    region: StoredRegion | null,
    expectedRevision: number,
  ): Promise<unknown>;
};
export function createRegionRepo(client = createDynamoDbClient()): RegionRepo {
  return {
    async get(wardrobeId) {
      const result = await client.getItem({
        Key: buildWardrobeMetaKey(wardrobeId),
        ConsistentRead: true,
      });
      return result.Item as RegionMeta | undefined;
    },
    async save(wardrobeId, region, expectedRevision) {
      return client.updateItem({
        Key: buildWardrobeMetaKey(wardrobeId),
        UpdateExpression: "SET #region = :region, #revision = :next",
        ConditionExpression: `attribute_exists(PK) AND ${expectedRevision === 0 ? "(attribute_not_exists(#revision) OR #revision = :expected)" : "#revision = :expected"}`,
        ExpressionAttributeNames: {
          "#region": "region",
          "#revision": "regionRevision",
        },
        ExpressionAttributeValues: {
          ":region": region,
          ":next": expectedRevision + 1,
          ":expected": expectedRevision,
        },
      });
    },
  };
}
export async function getRegionContext(
  wardrobeId: string,
  repo: RegionRepo = createRegionRepo(),
) {
  const item = await repo.get(wardrobeId);
  if (!item) throw createAppError("NOT_FOUND");
  return { revision: item.regionRevision ?? 0, region: item.region ?? null };
}
