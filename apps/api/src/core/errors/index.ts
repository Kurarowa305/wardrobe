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
