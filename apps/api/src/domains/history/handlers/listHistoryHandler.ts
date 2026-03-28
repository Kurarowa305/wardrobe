import { z } from "zod";

import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import {
  historyDateSchema,
  historyListLimitMax,
  historyListOrderSchema,
  historyListResponseSchema,
  historyWardrobePathParamsSchema,
} from "../schema/historySchema.js";
import { createHistoryUsecase, type HistoryUsecaseDependencies } from "../usecases/historyUsecase.js";

const historyListQuerySchema = z.object({
  from: historyDateSchema.optional(),
  to: historyDateSchema.optional(),
  order: historyListOrderSchema.optional(),
  limit: z.coerce.number().int().min(1).max(historyListLimitMax).optional(),
  cursor: z.string().trim().min(1).optional(),
}).strict().superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["from"],
      message: "from must be less than or equal to to.",
    });
  }
});

export const listHistoryRequestSchema = {
  path: historyWardrobePathParamsSchema,
  query: historyListQuerySchema,
} as const;

export type ListHistoryHandlerInput = {
  path?: unknown;
  query?: unknown;
  requestId?: string;
  dependencies?: HistoryUsecaseDependencies | undefined;
};

export type ListHistoryHandlerResponse = JsonResponse<z.infer<typeof historyListResponseSchema>>;

export async function listHistoryHandler(input: ListHistoryHandlerInput): Promise<ListHistoryHandlerResponse> {
  const parsed = parseRequest(listHistoryRequestSchema, {
    path: input.path,
    query: input.query,
  }, input.requestId);

  const usecase = createHistoryUsecase(input.dependencies);
  const result = await usecase.list({
    wardrobeId: parsed.path.wardrobeId,
    params: parsed.query,
    requestId: input.requestId,
  });

  return createSuccessResponse(historyListResponseSchema.parse(result));
}
