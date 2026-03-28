import { z } from "zod";

export const presignContentTypeValues = ["image/jpeg", "image/png", "image/webp"] as const;
export const presignCategoryValues = ["clothing", "template"] as const;
export const presignExtensionValues = ["jpg", "jpeg", "png", "webp"] as const;

export const presignImageKeyMaxLength = 2048;

export const presignContentTypeSchema = z.enum(presignContentTypeValues);
export const presignCategorySchema = z.enum(presignCategoryValues);
export const presignExtensionSchema = z.enum(presignExtensionValues);

export const presignWardrobePathParamsSchema = z.object({
  wardrobeId: z.string().trim().min(1),
}).strict();

export const createPresignRequestSchema = z.object({
  contentType: presignContentTypeSchema,
  category: presignCategorySchema,
  extension: presignExtensionSchema.optional(),
}).strict();

export const createPresignResponseSchema = z.object({
  imageKey: z.string().trim().min(1).max(presignImageKeyMaxLength),
  uploadUrl: z.url(),
  method: z.literal("PUT"),
  expiresAt: z.iso.datetime({ offset: true }),
}).strict();

export type PresignContentType = z.infer<typeof presignContentTypeSchema>;
export type PresignCategory = z.infer<typeof presignCategorySchema>;
export type PresignExtension = z.infer<typeof presignExtensionSchema>;
export type PresignWardrobePathParams = z.infer<typeof presignWardrobePathParamsSchema>;
export type CreatePresignRequest = z.infer<typeof createPresignRequestSchema>;
export type CreatePresignResponse = z.infer<typeof createPresignResponseSchema>;
