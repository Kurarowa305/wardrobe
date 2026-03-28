import { z } from "zod";

import {
  clothingGenreSchema,
  clothingIdSchema,
  clothingImageKeySchema,
  clothingStatusSchema,
  clothingTimestampSchema,
  clothingWearCountSchema,
} from "../../clothing/schema/clothingSchema.js";
import { templateNameSchema } from "../../template/schema/templateSchema.js";

export const historyListOrderValues = ["asc", "desc"] as const;

export const historyDatePattern = /^\d{8}$/;
export const historyClothingIdsMax = 4;
export const historyListLimitMax = 30;

export const historyListOrderSchema = z.enum(historyListOrderValues);
export const historyIdSchema = z.string().trim().min(1);
export const wardrobeIdSchema = z.string().trim().min(1);
export const historyDateSchema = z.string().regex(historyDatePattern, "Expected yyyymmdd format.");

export const historyClothingIdsSchema = z.array(clothingIdSchema).min(1).max(historyClothingIdsMax);

export const historyListParamsSchema = z.object({
  from: historyDateSchema.optional(),
  to: historyDateSchema.optional(),
  order: historyListOrderSchema.optional(),
  limit: z.number().int().min(1).max(historyListLimitMax).optional(),
  cursor: z.string().trim().min(1).nullable().optional(),
}).strict();

const templateInputSchema = z.object({
  date: historyDateSchema,
  templateId: z.string().trim().min(1),
  clothingIds: z.never().optional(),
}).strict();

const combinationInputSchema = z.object({
  date: historyDateSchema,
  templateId: z.never().optional(),
  clothingIds: historyClothingIdsSchema,
}).strict();

export const createHistoryRequestSchema = z.union([templateInputSchema, combinationInputSchema]);

export const historyListClothingItemSchema = z.object({
  clothingId: clothingIdSchema,
  name: z.string().trim().min(1),
  genre: clothingGenreSchema,
  imageKey: clothingImageKeySchema.nullable(),
  status: clothingStatusSchema,
}).strict();

export const historyDetailClothingItemSchema = historyListClothingItemSchema.extend({
  wearCount: clothingWearCountSchema,
  lastWornAt: clothingTimestampSchema,
}).strict();

export const historyListItemSchema = z.object({
  historyId: historyIdSchema,
  date: historyDateSchema,
  name: templateNameSchema.nullable(),
  clothingItems: z.array(historyListClothingItemSchema),
}).strict();

export const historyDetailResponseSchema = z.object({
  date: historyDateSchema,
  templateName: templateNameSchema.nullable(),
  clothingItems: z.array(historyDetailClothingItemSchema),
}).strict();

export const historyListResponseSchema = z.object({
  items: z.array(historyListItemSchema),
  nextCursor: z.string().trim().min(1).nullable(),
}).strict();

export const historyPathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
  historyId: historyIdSchema,
}).strict();

export const historyWardrobePathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
}).strict();

export const historyEntitySchema = z.object({
  wardrobeId: wardrobeIdSchema,
  historyId: historyIdSchema,
  date: historyDateSchema,
  templateId: z.string().trim().min(1).nullable(),
  clothingIds: historyClothingIdsSchema,
  createdAt: clothingTimestampSchema,
}).strict();

export type HistoryListOrder = z.infer<typeof historyListOrderSchema>;
export type HistoryListParams = z.infer<typeof historyListParamsSchema>;
export type CreateHistoryRequest = z.infer<typeof createHistoryRequestSchema>;
export type HistoryListClothingItem = z.infer<typeof historyListClothingItemSchema>;
export type HistoryDetailClothingItem = z.infer<typeof historyDetailClothingItemSchema>;
export type HistoryListItem = z.infer<typeof historyListItemSchema>;
export type HistoryDetailResponse = z.infer<typeof historyDetailResponseSchema>;
export type HistoryListResponse = z.infer<typeof historyListResponseSchema>;
export type HistoryPathParams = z.infer<typeof historyPathParamsSchema>;
export type HistoryWardrobePathParams = z.infer<typeof historyWardrobePathParamsSchema>;
export type HistoryEntityShape = z.infer<typeof historyEntitySchema>;
