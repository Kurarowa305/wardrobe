import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { templateDetailResponseSchema, templatePathParamsSchema } from "../schema/templateSchema.js";
import { createTemplateUsecase, type TemplateUsecaseDependencies } from "../usecases/templateUsecase.js";
import type { z } from "zod";

export const getTemplateRequestSchema = {
  path: templatePathParamsSchema,
} as const;

export type GetTemplateHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: TemplateUsecaseDependencies | undefined;
};

export type GetTemplateHandlerResponse = JsonResponse<z.infer<typeof templateDetailResponseSchema>>;

export async function getTemplateHandler(input: GetTemplateHandlerInput): Promise<GetTemplateHandlerResponse> {
  const parsed = parseRequest(getTemplateRequestSchema, {
    path: input.path,
  }, input.requestId);

  const usecase = createTemplateUsecase(input.dependencies);
  const result = await usecase.get({
    wardrobeId: parsed.path.wardrobeId,
    templateId: parsed.path.templateId,
  });

  return createSuccessResponse(templateDetailResponseSchema.parse(result));
}
