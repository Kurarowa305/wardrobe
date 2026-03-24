import { createNoContentResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { clothingPathParamsSchema } from "../schema/clothingSchema.js";
import { createClothingUsecase, type ClothingUsecaseDependencies } from "../usecases/clothingUsecase.js";

export const deleteClothingRequestSchemas = {
  path: clothingPathParamsSchema,
} as const;

export type DeleteClothingHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: ClothingUsecaseDependencies | undefined;
};

export async function deleteClothingHandler(input: DeleteClothingHandlerInput) {
  const parsed = parseRequest(deleteClothingRequestSchemas, {
    path: input.path,
  }, input.requestId);

  const usecase = createClothingUsecase(input.dependencies);
  await usecase.delete({
    wardrobeId: parsed.path.wardrobeId,
    clothingId: parsed.path.clothingId,
  });

  return createNoContentResponse();
}
