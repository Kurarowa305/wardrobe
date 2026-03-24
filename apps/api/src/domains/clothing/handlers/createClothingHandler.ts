import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createClothingRequestSchema, clothingWardrobePathParamsSchema } from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

export const createClothingRequestSchemas = {
  path: clothingWardrobePathParamsSchema,
  body: createClothingRequestSchema,
} as const;

export type CreateClothingHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export type CreateClothingHandlerResponse = JsonResponse<{
  clothingId: string;
}>;

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: CreateClothingHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

export async function createClothingHandler(input: CreateClothingHandlerInput): Promise<CreateClothingHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(createClothingRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  const result = await usecase.create({
    wardrobeId: parsed.path.wardrobeId,
    name: parsed.body.name,
    genre: parsed.body.genre,
    imageKey: parsed.body.imageKey,
  });

  return createSuccessResponse({
    clothingId: result.clothingId,
  }, 201);
}
