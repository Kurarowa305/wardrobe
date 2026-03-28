import { createNoContentResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { templatePathParamsSchema } from "../schema/templateSchema.js";
import { createTemplateUsecase, type TemplateUsecaseDependencies } from "../usecases/templateUsecase.js";

export const deleteTemplateRequestSchemas = {
  path: templatePathParamsSchema,
} as const;

export type DeleteTemplateHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: TemplateUsecaseDependencies | undefined;
};

export async function deleteTemplateHandler(input: DeleteTemplateHandlerInput) {
  const parsed = parseRequest(deleteTemplateRequestSchemas, {
    path: input.path,
  }, input.requestId);

  const usecase = createTemplateUsecase(input.dependencies);
  await usecase.delete({
    wardrobeId: parsed.path.wardrobeId,
    templateId: parsed.path.templateId,
  });

  return createNoContentResponse();
}
