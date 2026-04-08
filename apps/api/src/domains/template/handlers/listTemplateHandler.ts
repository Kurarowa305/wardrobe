import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import {
  templateListLimitMax,
  templateListOrderSchema,
  templateListResponseSchema,
  templateWardrobePathParamsSchema,
} from "../schema/templateSchema.js";
import { createTemplateUsecase, type TemplateUsecaseDependencies } from "../usecases/templateUsecase.js";

const templateListQuerySchema = z.object({
  order: z.preprocess((value) => Array.isArray(value) ? value[0] : value, templateListOrderSchema.optional()),
  limit: z.preprocess(
    (value) => Array.isArray(value) ? value[0] : value,
    z.coerce.number().int().min(1).max(templateListLimitMax).optional(),
  ),
  cursor: z.preprocess(
    (value) => Array.isArray(value) ? value[0] : value,
    z.string().trim().min(1).optional(),
  ),
}).strict();

export const listTemplateRequestSchema = {
  path: templateWardrobePathParamsSchema,
  query: templateListQuerySchema,
} as const;

export type ListTemplateHandlerInput = {
  path?: unknown;
  query?: unknown;
  requestId?: string;
  dependencies?: TemplateUsecaseDependencies | undefined;
};

export type ListTemplateHandlerResponse = JsonResponse<z.infer<typeof templateListResponseSchema>>;

export async function listTemplateHandler(input: ListTemplateHandlerInput): Promise<ListTemplateHandlerResponse> {
  const parsed = parseRequest(listTemplateRequestSchema, {
    path: input.path,
    query: input.query,
  }, input.requestId);

  const usecase = createTemplateUsecase(input.dependencies);
  const result = await usecase.list({
    wardrobeId: parsed.path.wardrobeId,
    params: parsed.query,
    requestId: input.requestId,
  });

  return createSuccessResponse(templateListResponseSchema.parse(result));
}
