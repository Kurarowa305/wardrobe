import type { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { historyDetailResponseSchema, historyPathParamsSchema } from "../schema/historySchema.js";
import { createHistoryUsecase, type HistoryUsecaseDependencies } from "../usecases/historyUsecase.js";

export const getHistoryRequestSchema = {
  path: historyPathParamsSchema,
} as const;

export type GetHistoryHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: HistoryUsecaseDependencies | undefined;
};

export type GetHistoryHandlerResponse = JsonResponse<z.infer<typeof historyDetailResponseSchema>>;

export async function getHistoryHandler(input: GetHistoryHandlerInput): Promise<GetHistoryHandlerResponse> {
  const parsed = parseRequest(getHistoryRequestSchema, {
    path: input.path,
  }, input.requestId);

  const usecase = createHistoryUsecase(input.dependencies);
  const result = await usecase.get({
    wardrobeId: parsed.path.wardrobeId,
    historyId: parsed.path.historyId,
  });

  return createSuccessResponse(historyDetailResponseSchema.parse(result));
}
