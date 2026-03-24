import { z } from "zod";

import {
  clothingDetailResponseSchema,
  clothingIdSchema,
  clothingImageKeySchema,
  clothingStatusSchema,
  clothingTimestampSchema,
  clothingWearCountSchema,
} from "../../clothing/schema/clothingSchema.js";

export const templateStatusValues = ["ACTIVE", "DELETED"] as const;
export const templateListOrderValues = ["asc", "desc"] as const;

export const templateNameMaxLength = 40;
export const templateClothingIdsMax = 20;
export const templateListLimitMax = 30;

export const templateStatusSchema = z.enum(templateStatusValues);
export const templateListOrderSchema = z.enum(templateListOrderValues);
export const templateIdSchema = z.string().trim().min(1);
export const wardrobeIdSchema = z.string().trim().min(1);
export const templateNameSchema = z.string().trim().min(1).max(templateNameMaxLength);
export const templateDeletedAtSchema = clothingTimestampSchema.nullable();
export const templateClothingIdsSchema = z.array(clothingIdSchema).min(1).max(templateClothingIdsMax);

export const templateListParamsSchema = z.object({
  order: templateListOrderSchema.optional(),
  limit: z.number().int().min(1).max(templateListLimitMax).optional(),
  cursor: z.string().trim().min(1).nullable().optional(),
}).strict();

export const createTemplateRequestSchema = z.object({
  name: templateNameSchema,
  clothingIds: templateClothingIdsSchema,
}).strict();

export const updateTemplateRequestSchema = z.object({
  name: templateNameSchema.optional(),
  clothingIds: templateClothingIdsSchema.optional(),
}).strict();

export const templateListClothingItemSchema = z.object({
  clothingId: clothingIdSchema,
  imageKey: clothingImageKeySchema.nullable(),
  status: clothingStatusSchema,
}).strict();

export const templateListItemSchema = z.object({
  templateId: templateIdSchema,
  name: templateNameSchema,
  clothingItems: z.array(templateListClothingItemSchema),
}).strict();

export const templateDetailResponseSchema = z.object({
  name: templateNameSchema,
  status: templateStatusSchema,
  wearCount: clothingWearCountSchema,
  lastWornAt: clothingTimestampSchema,
  clothingItems: z.array(clothingDetailResponseSchema),
}).strict();

export const templateListResponseSchema = z.object({
  items: z.array(templateListItemSchema),
  nextCursor: z.string().trim().min(1).nullable(),
}).strict();

export const templatePathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
  templateId: templateIdSchema,
}).strict();

export const templateWardrobePathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
}).strict();

export const templateEntitySchema = z.object({
  wardrobeId: wardrobeIdSchema,
  templateId: templateIdSchema,
  name: templateNameSchema,
  status: templateStatusSchema,
  clothingIds: templateClothingIdsSchema,
  wearCount: clothingWearCountSchema,
  lastWornAt: clothingTimestampSchema,
  createdAt: clothingTimestampSchema,
  deletedAt: templateDeletedAtSchema,
}).strict();

export type TemplateStatus = z.infer<typeof templateStatusSchema>;
export type TemplateListOrder = z.infer<typeof templateListOrderSchema>;
export type TemplateListParams = z.infer<typeof templateListParamsSchema>;
export type CreateTemplateRequest = z.infer<typeof createTemplateRequestSchema>;
export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequestSchema>;
export type TemplateListClothingItem = z.infer<typeof templateListClothingItemSchema>;
export type TemplateListItem = z.infer<typeof templateListItemSchema>;
export type TemplateDetailResponse = z.infer<typeof templateDetailResponseSchema>;
export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;
export type TemplatePathParams = z.infer<typeof templatePathParamsSchema>;
export type TemplateWardrobePathParams = z.infer<typeof templateWardrobePathParamsSchema>;
export type TemplateEntityShape = z.infer<typeof templateEntitySchema>;
