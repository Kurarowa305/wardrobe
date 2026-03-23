import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createWardrobeUsecase, type WardrobeUsecaseDependencies } from "../usecases/wardrobeUsecase.js";

const wardrobePathSchema = z.object({
  wardrobeId: z.string().trim().min(1, "String must contain at least 1 character(s)."),
}).strict();

export const getWardrobeRequestSchema = {
  path: wardrobePathSchema,
} as const;

export type GetWardrobeHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: WardrobeUsecaseDependencies | undefined;
};

export type GetWardrobeHandlerResponse = JsonResponse<{
  name: string;
}>;

export async function getWardrobeHandler(input: GetWardrobeHandlerInput): Promise<GetWardrobeHandlerResponse> {
  const parsed = parseRequest(getWardrobeRequestSchema, {
    path: input.path,
  }, input.requestId);

  const usecase = createWardrobeUsecase(input.dependencies);
  const result = await usecase.get({
    wardrobeId: parsed.path.wardrobeId,
  });

  return createSuccessResponse({
    name: result.name,
  });
}
