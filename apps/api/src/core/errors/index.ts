export const errorCodes = [
  "VALIDATION_ERROR",
  "INVALID_CURSOR",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export type ErrorDetails = Record<string, unknown>;

export type ErrorHttpStatus = 400 | 404 | 409 | 413 | 415 | 429 | 500 | 503;

export type AppErrorOptions = {
  message?: string | undefined;
  details?: ErrorDetails | undefined;
  requestId?: string | undefined;
  cause?: unknown;
};

const defaultMessages: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Invalid request parameters.",
  INVALID_CURSOR: "Cursor is invalid.",
  NOT_FOUND: "Resource was not found.",
  CONFLICT: "Request conflicts with current resource state.",
  PAYLOAD_TOO_LARGE: "Request payload is too large.",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported media type.",
  RATE_LIMITED: "Too many requests.",
  INTERNAL_ERROR: "Internal server error.",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable.",
};

export const errorStatusByCode: Record<ErrorCode, ErrorHttpStatus> = {
  VALIDATION_ERROR: 400,
  INVALID_CURSOR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: ErrorHttpStatus;
  readonly details: ErrorDetails | undefined;
  readonly requestId: string | undefined;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    super(options.message ?? defaultMessages[code], options.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = errorStatusByCode[code];
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && errorCodes.includes(value as ErrorCode);
}

export function getErrorStatus(code: ErrorCode): ErrorHttpStatus {
  return errorStatusByCode[code];
}

export function getDefaultErrorMessage(code: ErrorCode): string {
  return defaultMessages[code];
}

export function createAppError(code: ErrorCode, options: AppErrorOptions = {}): AppError {
  return new AppError(code, options);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function normalizeUnknownError(error: unknown, requestId?: string): AppError {
  if (isAppError(error)) {
    if (requestId && !error.requestId) {
      return createAppError(error.code, {
        message: error.message,
        details: error.details,
        requestId,
        cause: error.cause,
      });
    }

    return error;
  }

  if (error instanceof Error) {
    return createAppError("INTERNAL_ERROR", {
      message: error.message || getDefaultErrorMessage("INTERNAL_ERROR"),
      requestId,
      cause: error,
    });
  }

  return createAppError("INTERNAL_ERROR", {
    requestId,
    details: error === undefined ? undefined : { value: error },
  });
}
