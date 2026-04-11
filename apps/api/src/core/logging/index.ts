import { normalizeUnknownError, type ErrorCode } from "../errors/index.js";

export type LogDomain = "wardrobe" | "clothing" | "template" | "history" | "presign" | "stats" | (string & {});

export type LogContext = {
  requestId?: string;
  method?: string;
  path?: string;
  domain?: LogDomain;
  wardrobeId?: string;
};

export type LogOutcome = {
  statusCode: number;
  durationMs: number;
  errorCode?: ErrorCode;
  errorResponseBody?: unknown;
};

export type RequestLogEntry = {
  timestamp: string;
  level: "info" | "error";
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  domain?: LogDomain;
  wardrobeId?: string;
  statusCode: number;
  durationMs: number;
  errorCode?: ErrorCode;
  errorResponseBody?: unknown;
};

export type CreateRequestLogEntryOptions = {
  timestamp?: Date;
  message?: string;
  level?: "info" | "error";
};

export type StructuredLogger = {
  info(entry: RequestLogEntry): void;
  error(entry: RequestLogEntry): void;
};

const DEFAULT_LOG_MESSAGE = "request_completed";

export function createRequestLogEntry(
  context: LogContext,
  outcome: LogOutcome,
  options: CreateRequestLogEntryOptions = {},
): RequestLogEntry {
  return {
    timestamp: (options.timestamp ?? new Date()).toISOString(),
    level: options.level ?? (outcome.errorCode ? "error" : "info"),
    message: options.message ?? DEFAULT_LOG_MESSAGE,
    ...(context.requestId ? { requestId: context.requestId } : {}),
    ...(context.method ? { method: context.method } : {}),
    ...(context.path ? { path: context.path } : {}),
    ...(context.domain ? { domain: context.domain } : {}),
    ...(context.wardrobeId ? { wardrobeId: context.wardrobeId } : {}),
    statusCode: outcome.statusCode,
    durationMs: outcome.durationMs,
    ...(outcome.errorCode ? { errorCode: outcome.errorCode } : {}),
    ...(outcome.errorResponseBody !== undefined ? { errorResponseBody: outcome.errorResponseBody } : {}),
  };
}

export function serializeLogEntry(entry: RequestLogEntry): string {
  return JSON.stringify(entry);
}

export function createConsoleLogger(): StructuredLogger {
  return {
    info(entry) {
      console.info(serializeLogEntry(entry));
    },
    error(entry) {
      console.error(serializeLogEntry(entry));
    },
  };
}

export function logRequest(
  logger: StructuredLogger,
  context: LogContext,
  outcome: LogOutcome,
  options: CreateRequestLogEntryOptions = {},
): RequestLogEntry {
  const entry = createRequestLogEntry(context, outcome, options);

  if (entry.level === "error") {
    logger.error(entry);
  } else {
    logger.info(entry);
  }

  return entry;
}

export function measureDurationMs(startTime: number, endTime = Date.now()): number {
  return Math.max(0, endTime - startTime);
}

export function createErrorLogOutcome(
  error: unknown,
  context: Pick<LogContext, "requestId"> & {
    statusCode?: number;
  } = {},
): LogOutcome {
  const normalized = normalizeUnknownError(error, context.requestId);

  return {
    statusCode: context.statusCode ?? normalized.status,
    durationMs: 0,
    errorCode: normalized.code,
  };
}
