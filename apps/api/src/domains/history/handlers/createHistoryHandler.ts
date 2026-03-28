import { createAppError } from "../../../core/errors/index.js";
import { createSuccessResponse, type JsonResponse } from "../../../core/response/index.js";
import { parseRequest } from "../../../core/validation/index.js";
import { createHistoryWithStatsWriteUsecase, type CreateHistoryWithStatsWriteDependencies } from "../usecases/createHistoryWithStatsWrite.js";
import { createHistoryRequestSchema, historyWardrobePathParamsSchema } from "../schema/historySchema.js";

export const createHistoryRequestSchemas = {
  path: historyWardrobePathParamsSchema,
  body: createHistoryRequestSchema,
} as const;

export type CreateHistoryHandlerInput = {
  path?: unknown;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
  requestId?: string;
  dependencies?: CreateHistoryWithStatsWriteDependencies | undefined;
};

export type CreateHistoryHandlerResponse = JsonResponse<{
  historyId: string;
}>;

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && /^application\/json\b/i.test(contentType);
}

function assertJsonContentType(headers: CreateHistoryHandlerInput["headers"]): void {
  const raw = headers?.["content-type"];
  const contentType = Array.isArray(raw) ? raw[0] : raw;

  if (!isJsonContentType(contentType)) {
    throw createAppError("UNSUPPORTED_MEDIA_TYPE", {
      message: "Content-Type must be application/json.",
    });
  }
}

function isDynamoConditionCheckFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    CancellationReasons?: unknown;
    cancellationReasons?: unknown;
  };

  const name = typeof candidate.name === "string" ? candidate.name : "";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  const reasons = Array.isArray(candidate.CancellationReasons)
    ? candidate.CancellationReasons
    : Array.isArray(candidate.cancellationReasons)
      ? candidate.cancellationReasons
      : [];

  const reasonHasConditionalCheck = reasons.some((reason) => {
    if (!reason || typeof reason !== "object") {
      return false;
    }

    const reasonCode = (reason as { Code?: unknown; code?: unknown }).Code ?? (reason as { code?: unknown }).code;
    return reasonCode === "ConditionalCheckFailed";
  });

  return name === "ConditionalCheckFailedException"
    || code === "ConditionalCheckFailedException"
    || name === "TransactionCanceledException"
    || code === "TransactionCanceledException"
    || message.includes("ConditionalCheckFailed")
    || reasonHasConditionalCheck;
}

export async function createHistoryHandler(input: CreateHistoryHandlerInput): Promise<CreateHistoryHandlerResponse> {
  assertJsonContentType(input.headers);

  const parsed = parseRequest(createHistoryRequestSchemas, {
    path: input.path,
    body: input.body,
  }, input.requestId);

  const usecase = createHistoryWithStatsWriteUsecase(input.dependencies);
  let result;
  try {
    result = await usecase.create({
      wardrobeId: parsed.path.wardrobeId,
      date: parsed.body.date,
      ...(parsed.body.templateId ? { templateId: parsed.body.templateId } : {}),
      ...(parsed.body.clothingIds ? { clothingIds: parsed.body.clothingIds } : {}),
    });
  } catch (error) {
    if (isDynamoConditionCheckFailure(error)) {
      throw createAppError("NOT_FOUND", {
        message: "Referenced template or clothing was not found.",
        requestId: input.requestId,
        cause: error,
      });
    }

    throw error;
  }

  return createSuccessResponse({
    historyId: result.historyId,
  }, 201);
}
