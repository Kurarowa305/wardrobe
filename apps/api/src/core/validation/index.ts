import { z, ZodError, type ZodType } from "zod";

import { createAppError, type AppError, type ErrorDetails } from "../errors/index.js";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: string[] };

export type RequestSchema<TPath, TQuery, TBody> = {
  path?: ZodType<TPath> | undefined;
  query?: ZodType<TQuery> | undefined;
  body?: ZodType<TBody> | undefined;
};

export type RequestInput = {
  path?: unknown;
  query?: unknown;
  body?: unknown;
};

export type ParsedRequest<TPath, TQuery, TBody> = {
  path: TPath;
  query: TQuery;
  body: TBody;
};

export const emptyObjectSchema = z.object({}).strict();

function resolveSchema<T>(schema: ZodType<T> | undefined): ZodType<T> {
  return (schema ?? emptyObjectSchema) as ZodType<T>;
}

const validationMessageFallback = "Invalid input.";

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "root";
  }

  return path.reduce<string>((accumulator, segment) => {
    if (typeof segment === "number") {
      return `${accumulator}[${segment}]`;
    }

    return accumulator ? `${accumulator}.${String(segment)}` : String(segment);
  }, "");
}

function issueKey(scope: string, path: PropertyKey[]): string {
  const formattedPath = formatIssuePath(path);
  return formattedPath === "root" ? scope : `${scope}.${formattedPath}`;
}

function issueMessage(error: ZodError): string[] {
  return error.issues.map((issue) => `${formatIssuePath(issue.path)}: ${issue.message || validationMessageFallback}`);
}

function toErrorDetails(scope: string, error: ZodError): ErrorDetails {
  return Object.fromEntries(
    error.issues.map((issue) => [issueKey(scope, issue.path), issue.message || validationMessageFallback]),
  );
}

export function normalizeValidationError(scope: string, error: ZodError, requestId?: string): AppError {
  return createAppError("VALIDATION_ERROR", {
    requestId,
    details: toErrorDetails(scope, error),
  });
}

export function safeValidate<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    issues: issueMessage(result.error),
  };
}

export function validateOrThrow<T>(scope: string, schema: ZodType<T>, input: unknown, requestId?: string): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  throw normalizeValidationError(scope, result.error, requestId);
}

export function parseRequest<TPath = Record<string, never>, TQuery = Record<string, never>, TBody = Record<string, never>>(
  schema: RequestSchema<TPath, TQuery, TBody>,
  input: RequestInput,
  requestId?: string,
): ParsedRequest<TPath, TQuery, TBody> {
  return {
    path: validateOrThrow("path", resolveSchema(schema.path), input.path ?? {}, requestId),
    query: validateOrThrow("query", resolveSchema(schema.query), input.query ?? {}, requestId),
    body: validateOrThrow("body", resolveSchema(schema.body), input.body ?? {}, requestId),
  };
}
