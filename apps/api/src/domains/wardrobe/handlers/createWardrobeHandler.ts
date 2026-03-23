import { z } from "zod";

import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createWardrobeUsecase, type WardrobeUsecaseDependencies } from "../usecases/wardrobeUsecase.js";

export const wardrobeNameMaxLength = 40;

const wardrobeNameSchema = z.string()
  .trim()
  .min(1, "String must contain at least 1 character(s).")
  .max(wardrobeNameMaxLength, `String must contain at most ${wardrobeNameMaxLength} character(s).`);

export const createWardrobeRequestSchema = {
  body: z.object({
    name: wardrobeNameSchema,
  }).strict(),
} as const;

export type CreateWardrobeHandlerInput = {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: WardrobeUsecaseDependencies | undefined;
};

export type CreateWardrobeHandlerResponse = JsonResponse<{
  wardrobeId: string;
}>;

export function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

export function assertJsonContentType(headers: CreateWardrobeHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function createWardrobeHandler(input: CreateWardrobeHandlerInput): Promise<CreateWardrobeHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(createWardrobeRequestSchema, {
    body: input.body,
  }, input.requestId);

  const usecase = createWardrobeUsecase(input.dependencies);
  const result = await usecase.create({
    name: parsed.body.name,
  });

  return createSuccessResponse({
    wardrobeId: result.wardrobeId,
  }, 201);
}
