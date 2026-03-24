import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { clothingPathParamsSchema, updateClothingRequestSchema } from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

export const updateClothingRequestSchemas = {
  path: clothingPathParamsSchema,
  body: updateClothingRequestSchema,
} as const;

export type UpdateClothingHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export type UpdateClothingHandlerResponse = JsonResponse<{
  clothingId: string;
}>;

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: UpdateClothingHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function updateClothingHandler(input: UpdateClothingHandlerInput): Promise<UpdateClothingHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(updateClothingRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  const result = await usecase.update({
    wardrobeId: parsed.path.wardrobeId,
    clothingId: parsed.path.clothingId,
    name: parsed.body.name,
    imageKey: parsed.body.imageKey,
  });

  return createSuccessResponse({
    clothingId: result.clothingId,
  });
}
