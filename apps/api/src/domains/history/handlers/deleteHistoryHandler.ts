import { z } from "zod";

import { createNoContentResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";

const idSchema = z.string().trim().min(1);

export const deleteHistoryRequestSchema = {
  path: z.object({
    wardrobeId: idSchema,
    historyId: idSchema,
  }).strict(),
} as const;

export type DeleteHistoryHandlerInput = {
  path?: unknown;
  requestId?: string;
};

export function deleteHistoryHandler(input: DeleteHistoryHandlerInput) {
  parseRequest(deleteHistoryRequestSchema, {
    path: input.path,
  }, input.requestId);

  return createNoContentResponse();
}
