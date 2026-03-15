const FALLBACK_ERROR_CODE = "UNKNOWN_ERROR";

type AppErrorParams = {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
  requestId?: string;
  originalError?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function codeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 415:
      return "UNSUPPORTED_MEDIA_TYPE";
    case 429:
      return "RATE_LIMITED";
    case 500:
      return "INTERNAL_ERROR";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return FALLBACK_ERROR_CODE;
  }
}

export class AppError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly originalError?: unknown;

  constructor({ code, message, status, details, requestId, originalError }: AppErrorParams) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.originalError = originalError;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function normalizeApiError(response: Response, payload: unknown): AppError {
  const envelope = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;
  const code = pickNonEmptyString(envelope?.code) ?? codeFromStatus(response.status);
  const message =
    pickNonEmptyString(envelope?.message) ??
    `API request failed with status ${response.status}.`;
  const details = envelope?.details;
  const requestId = pickNonEmptyString(envelope?.requestId);

  return new AppError({
    code,
    message,
    status: response.status,
    details,
    requestId,
  });
}

export function createTimeoutError(timeoutMs: number, originalError?: unknown): AppError {
  return new AppError({
    code: "TIMEOUT",
    message: `リクエストがタイムアウトしました (${timeoutMs}ms)。`,
    details: { timeoutMs },
    originalError,
  });
}

export function normalizeUnknownError(
  error: unknown,
  fallbackMessage = "不明なエラーが発生しました。",
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      code: FALLBACK_ERROR_CODE,
      message: error.message || fallbackMessage,
      originalError: error,
    });
  }

  return new AppError({
    code: FALLBACK_ERROR_CODE,
    message: fallbackMessage,
    details: error,
    originalError: error,
  });
}
