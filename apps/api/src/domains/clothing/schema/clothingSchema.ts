import { z } from "zod";

export const clothingStatusValues = ["ACTIVE", "DELETED"] as const;
export const clothingGenreValues = ["tops", "bottoms", "others"] as const;
export const clothingListOrderValues = ["asc", "desc"] as const;

export const clothingNameMaxLength = 40;
export const clothingImageKeyMaxLength = 2048;
export const clothingListLimitMax = 50;

export const clothingStatusSchema = z.enum(clothingStatusValues);
export const clothingGenreSchema = z.enum(clothingGenreValues);
export const clothingListOrderSchema = z.enum(clothingListOrderValues);
export const clothingIdSchema = z.string().trim().min(1);
export const wardrobeIdSchema = z.string().trim().min(1);
export const clothingNameSchema = z.string().trim().min(1).max(clothingNameMaxLength);
export const clothingImageKeySchema = z.string().trim().min(1).max(clothingImageKeyMaxLength);
export const clothingWearCountSchema = z.number().int().min(0);
export const clothingTimestampSchema = z.number().int().min(0);
export const clothingDeletedAtSchema = clothingTimestampSchema.nullable();

export const clothingListParamsSchema = z.object({
  order: clothingListOrderSchema.optional(),
  genre: clothingGenreSchema.optional(),
  limit: z.number().int().min(1).max(clothingListLimitMax).optional(),
  cursor: z.string().trim().min(1).nullable().optional(),
}).strict();

export const createClothingRequestSchema = z.object({
  name: clothingNameSchema,
  genre: clothingGenreSchema,
  imageKey: clothingImageKeySchema.nullable().optional(),
}).strict();

export const updateClothingRequestSchema = z.object({
  name: clothingNameSchema.optional(),
  imageKey: clothingImageKeySchema.nullable().optional(),
}).strict();

export const clothingListItemSchema = z.object({
  clothingId: clothingIdSchema,
  name: clothingNameSchema,
  genre: clothingGenreSchema,
  imageKey: clothingImageKeySchema.nullable(),
}).strict();

export const clothingDetailResponseSchema = z.object({
  clothingId: clothingIdSchema,
  name: clothingNameSchema,
  genre: clothingGenreSchema,
  imageKey: clothingImageKeySchema.nullable(),
  status: clothingStatusSchema,
  wearCount: clothingWearCountSchema,
  lastWornAt: clothingTimestampSchema,
}).strict();

export const clothingListResponseSchema = z.object({
  items: z.array(clothingListItemSchema),
  nextCursor: z.string().trim().min(1).nullable(),
}).strict();

export const clothingPathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
  clothingId: clothingIdSchema,
}).strict();

export const clothingWardrobePathParamsSchema = z.object({
  wardrobeId: wardrobeIdSchema,
}).strict();

export const clothingEntitySchema = z.object({
  wardrobeId: wardrobeIdSchema,
  clothingId: clothingIdSchema,
  name: clothingNameSchema,
  genre: clothingGenreSchema,
  imageKey: clothingImageKeySchema.nullable(),
  status: clothingStatusSchema,
  wearCount: clothingWearCountSchema,
  lastWornAt: clothingTimestampSchema,
  createdAt: clothingTimestampSchema,
  deletedAt: clothingDeletedAtSchema,
}).strict();

export type ClothingStatus = z.infer<typeof clothingStatusSchema>;
export type ClothingGenre = z.infer<typeof clothingGenreSchema>;
export type ClothingListOrder = z.infer<typeof clothingListOrderSchema>;
export type ClothingListParams = z.infer<typeof clothingListParamsSchema>;
export type CreateClothingRequest = z.infer<typeof createClothingRequestSchema>;
export type UpdateClothingRequest = z.infer<typeof updateClothingRequestSchema>;
export type ClothingListItem = z.infer<typeof clothingListItemSchema>;
export type ClothingDetailResponse = z.infer<typeof clothingDetailResponseSchema>;
export type ClothingListResponse = z.infer<typeof clothingListResponseSchema>;
export type ClothingPathParams = z.infer<typeof clothingPathParamsSchema>;
export type ClothingWardrobePathParams = z.infer<typeof clothingWardrobePathParamsSchema>;
export type ClothingEntityShape = z.infer<typeof clothingEntitySchema>;
