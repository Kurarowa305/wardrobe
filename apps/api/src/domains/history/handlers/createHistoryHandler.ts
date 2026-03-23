import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";

const idSchema = z.string().trim().min(1);
const yyyymmddSchema = z.string().regex(/^\d{8}$/, "Expected yyyymmdd format.");

export const createHistoryRequestSchema = {
  path: z.object({
    wardrobeId: idSchema,
  }).strict(),
  body: z.object({
    date: yyyymmddSchema,
    templateId: idSchema.optional(),
    clothingIds: z.array(idSchema).min(1).max(50).optional(),
  }).strict().superRefine((value, context) => {
    if (value.templateId && value.clothingIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["templateId"],
        message: "templateId and clothingIds cannot be used together.",
      });
    }

    if (!value.templateId && !value.clothingIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clothingIds"],
        message: "Either templateId or clothingIds is required.",
      });
    }
  }),
} as const;

export type CreateHistoryHandlerInput = {
  path?: unknown;
  body?: unknown;
  requestId?: string;
};

export type CreateHistoryHandlerResponse = JsonResponse<{
  ok: true;
  wardrobeId: string;
  date: string;
  inputType: "template" | "clothing";
}>;

export function createHistoryHandler(input: CreateHistoryHandlerInput): CreateHistoryHandlerResponse {
  const parsed = parseRequest(createHistoryRequestSchema, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  return createSuccessResponse({
    ok: true,
    wardrobeId: parsed.path.wardrobeId,
    date: parsed.body.date,
    inputType: parsed.body.templateId ? "template" : "clothing",
  }, 201);
}
