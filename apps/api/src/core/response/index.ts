import { getDefaultErrorMessage, normalizeUnknownError, type AppError, type ErrorDetails, type ErrorCode } from "../errors/index.js";

export const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

export type JsonHeaders = Record<string, string>;

export type JsonResponse<T> = {
  statusCode: number;
  headers: JsonHeaders;
  body: string;
  json: T;
};

export type ErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails | undefined;
    requestId?: string | undefined;
  };
};

export type CreateJsonResponseOptions = {
  headers?: JsonHeaders | undefined;
};

export type CreateErrorResponseOptions = CreateJsonResponseOptions & {
  requestId?: string | undefined;
  statusCode?: number | undefined;
};

export function createJsonHeaders(headers: JsonHeaders = {}): JsonHeaders {
  return {
    "content-type": JSON_CONTENT_TYPE,
    ...headers,
  };
}

export function createJsonResponse<T>(
  statusCode: number,
  json: T,
  options: CreateJsonResponseOptions = {},
): JsonResponse<T> {
  return {
    statusCode,
    headers: createJsonHeaders(options.headers),
    body: JSON.stringify(json),
    json,
  };
}

export function createSuccessResponse<T>(
  json: T,
  statusCode = 200,
  options: CreateJsonResponseOptions = {},
): JsonResponse<T> {
  return createJsonResponse(statusCode, json, options);
}

export function createNoContentResponse(statusCode = 204, headers: JsonHeaders = {}): {
  statusCode: number;
  headers: JsonHeaders;
  body: "";
} {
  return {
    statusCode,
    headers,
    body: "",
  };
}

export function toErrorBody(error: AppError): ErrorBody {
  return {
    error: {
      code: error.code,
      message: error.message || getDefaultErrorMessage(error.code),
      ...(error.details ? { details: error.details } : {}),
      ...(error.requestId ? { requestId: error.requestId } : {}),
    },
  };
}

export function createErrorResponse(
  error: unknown,
  options: CreateErrorResponseOptions = {},
): JsonResponse<ErrorBody> {
  const normalized = normalizeUnknownError(error, options.requestId);
  const statusCode = options.statusCode ?? normalized.status;

  return createJsonResponse(statusCode, toErrorBody(normalized), {
    headers: options.headers,
  });
}
