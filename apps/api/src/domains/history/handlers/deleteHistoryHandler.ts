import { createNoContentResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { historyPathParamsSchema } from "../schema/historySchema.js";
import {
  createDeleteHistoryWithStatsWriteUsecase,
  type DeleteHistoryWithStatsWriteDependencies,
} from "../usecases/deleteHistoryWithStatsWrite.js";

export const deleteHistoryRequestSchemas = {
  path: historyPathParamsSchema,
} as const;

export type DeleteHistoryHandlerInput = {
  path?: unknown;
  requestId?: string;
  dependencies?: DeleteHistoryWithStatsWriteDependencies | undefined;
};

export async function deleteHistoryHandler(input: DeleteHistoryHandlerInput) {
  const parsed = parseRequest(deleteHistoryRequestSchemas, {
    path: input.path,
  }, input.requestId);

  const usecase = createDeleteHistoryWithStatsWriteUsecase(input.dependencies);
  await usecase.delete({
    wardrobeId: parsed.path.wardrobeId,
    historyId: parsed.path.historyId,
  });

  return createNoContentResponse();
}
