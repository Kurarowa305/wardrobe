import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import {
  clothingRecommendationsResponseSchema,
  clothingWardrobePathParamsSchema,
} from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

export const getClothingRecommendationsRequestSchema = {
  path: clothingWardrobePathParamsSchema,
} as const;

export type GetClothingRecommendationsHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export type GetClothingRecommendationsHandlerResponse = JsonResponse<z.infer<typeof clothingRecommendationsResponseSchema>>;

export async function getClothingRecommendationsHandler(
  input: GetClothingRecommendationsHandlerInput,
): Promise<GetClothingRecommendationsHandlerResponse> {
  const parsed = parseRequest(getClothingRecommendationsRequestSchema, {
    path: input.path,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  const result = await usecase.getRecommendations({
    wardrobeId: parsed.path.wardrobeId,
  });

  return createSuccessResponse(clothingRecommendationsResponseSchema.parse(result));
}
