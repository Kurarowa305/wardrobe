import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import {
  clothingGenreSchema,
  clothingListLimitMax,
  clothingListOrderSchema,
  clothingListResponseSchema,
  clothingWardrobePathParamsSchema,
} from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

const clothingListQuerySchema = z.object({
  order: clothingListOrderSchema.optional(),
  genre: clothingGenreSchema.optional(),
  limit: z.coerce.number().int().min(1).max(clothingListLimitMax).optional(),
  cursor: z.string().trim().min(1).optional(),
}).strict();

export const listClothingRequestSchema = {
  path: clothingWardrobePathParamsSchema,
  query: clothingListQuerySchema,
} as const;

export type ListClothingHandlerInput = {
  path?: unknown;
  query?: unknown;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export type ListClothingHandlerResponse = JsonResponse<z.infer<typeof clothingListResponseSchema>>;

export async function listClothingHandler(input: ListClothingHandlerInput): Promise<ListClothingHandlerResponse> {
  const parsed = parseRequest(listClothingRequestSchema, {
    path: input.path,
    query: input.query,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  const result = await usecase.list({
    wardrobeId: parsed.path.wardrobeId,
    params: parsed.query,
    requestId: input.requestId,
  });

  return createSuccessResponse(clothingListResponseSchema.parse(result));
}
