import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { clothingDetailResponseSchema, clothingPathParamsSchema } from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

export const getClothingRequestSchemas = {
  path: clothingPathParamsSchema,
} as const;

export type GetClothingHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export type GetClothingHandlerResponse = JsonResponse<z.infer<typeof clothingDetailResponseSchema>>;

export async function getClothingHandler(input: GetClothingHandlerInput): Promise<GetClothingHandlerResponse> {
  const parsed = parseRequest(getClothingRequestSchemas, {
    path: input.path,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  const result = await usecase.get({
    wardrobeId: parsed.path.wardrobeId,
    clothingId: parsed.path.clothingId,
  });

  return createSuccessResponse(clothingDetailResponseSchema.parse(result));
}
