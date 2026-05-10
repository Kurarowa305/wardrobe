import { z } from "zod";

export const itemTagIdValues = ["season:summer", "season:winter", "season:all"] as const;
export const itemTagIdsMax = itemTagIdValues.length;

export const itemTagIdSchema = z.enum(itemTagIdValues);
export const itemTagIdsSchema = z.array(itemTagIdSchema)
  .max(itemTagIdsMax)
  .refine((tagIds) => new Set(tagIds).size === tagIds.length, {
    message: "tagIds must not contain duplicates.",
  });

export type ItemTagId = z.infer<typeof itemTagIdSchema>;

export function isItemTagId(value: unknown): value is ItemTagId {
  return typeof value === "string" && itemTagIdValues.includes(value as ItemTagId);
}

export function normalizeItemTagIds(value: unknown): ItemTagId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const tagIds = value.filter(isItemTagId);
  return [...new Set(tagIds)];
}
