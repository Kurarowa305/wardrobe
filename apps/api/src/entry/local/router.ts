import type { IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";

import { createAppError } from "../../core/errors/index.js";
import { createErrorResponse, type JsonResponse } from "../../core/response/index.js";
import { sharedDomainHandlers } from "../lambda/adapter.js";

export const localRoutePatterns = [
  "/wardrobes",
  "/wardrobes/:wardrobeId",
  "/wardrobes/:wardrobeId/clothing",
  "/wardrobes/:wardrobeId/clothing/:clothingId",
  "/wardrobes/:wardrobeId/templates",
  "/wardrobes/:wardrobeId/templates/:templateId",
  "/wardrobes/:wardrobeId/histories",
  "/wardrobes/:wardrobeId/histories/:historyId",
  "/wardrobes/:wardrobeId/images/presign",
] as const;

export type LocalRoutePattern = (typeof localRoutePatterns)[number];
export type LocalDomain = "wardrobe" | "clothing" | "template" | "history" | "presign";
export type LocalRouteMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type LocalRouteParams = Record<string, string>;
export type LocalRouteQuery = Record<string, string | string[]>;

export type LocalRouteDefinition = {
  method: LocalRouteMethod;
  pattern: LocalRoutePattern;
  domain: LocalDomain;
};

export type LocalRouteMatch = LocalRouteDefinition & {
  params: LocalRouteParams;
};

export type LocalRouteRequest = {
  requestId: string;
  method: string;
  pathname: string;
  path: LocalRouteParams;
  query: LocalRouteQuery;
  body: unknown;
  headers: IncomingMessage["headers"];
};

export type LocalRouteHandler = (
  request: LocalRouteRequest,
) =>
  | Promise<JsonResponse<unknown> | { statusCode: number; headers: Record<string, string>; body: string }>
  | JsonResponse<unknown>
  | { statusCode: number; headers: Record<string, string>; body: string };

export const localRoutes: readonly LocalRouteDefinition[] = [
  { method: "POST", pattern: "/wardrobes", domain: "wardrobe" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId", domain: "wardrobe" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/clothing", domain: "clothing" },
  { method: "POST", pattern: "/wardrobes/:wardrobeId/clothing", domain: "clothing" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/clothing/:clothingId", domain: "clothing" },
  { method: "PATCH", pattern: "/wardrobes/:wardrobeId/clothing/:clothingId", domain: "clothing" },
  { method: "DELETE", pattern: "/wardrobes/:wardrobeId/clothing/:clothingId", domain: "clothing" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/templates", domain: "template" },
  { method: "POST", pattern: "/wardrobes/:wardrobeId/templates", domain: "template" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/templates/:templateId", domain: "template" },
  { method: "PATCH", pattern: "/wardrobes/:wardrobeId/templates/:templateId", domain: "template" },
  { method: "DELETE", pattern: "/wardrobes/:wardrobeId/templates/:templateId", domain: "template" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/histories", domain: "history" },
  { method: "POST", pattern: "/wardrobes/:wardrobeId/histories", domain: "history" },
  { method: "GET", pattern: "/wardrobes/:wardrobeId/histories/:historyId", domain: "history" },
  { method: "DELETE", pattern: "/wardrobes/:wardrobeId/histories/:historyId", domain: "history" },
  { method: "POST", pattern: "/wardrobes/:wardrobeId/images/presign", domain: "presign" },
] as const;

const defaultHandlers: Record<LocalDomain, LocalRouteHandler> = sharedDomainHandlers;

export function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  const normalized = pathname.replace(/\/+$/u, "");
  return normalized === "" ? "/" : normalized;
}

function splitSegments(pathname: string): string[] {
  return normalizePathname(pathname)
    .split("/")
    .filter(Boolean);
}

function matchPattern(pattern: LocalRoutePattern, pathname: string): LocalRouteParams | null {
  const patternSegments = splitSegments(pattern);
  const pathSegments = splitSegments(pathname);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: LocalRouteParams = {};

  for (const [index, patternSegment] of patternSegments.entries()) {
    const pathSegment = pathSegments[index];
    if (!pathSegment) {
      return null;
    }

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function resolveLocalRoute(method: string, pathname: string): LocalRouteMatch | null {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = normalizePathname(pathname);

  for (const route of localRoutes) {
    if (route.method !== normalizedMethod) {
      continue;
    }

    const params = matchPattern(route.pattern, normalizedPath);
    if (params) {
      return { ...route, params };
    }
  }

  return null;
}

export function isKnownLocalPath(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname);
  return localRoutePatterns.some((pattern) => matchPattern(pattern, normalizedPath) !== null);
}

export function toQueryParams(searchParams: URLSearchParams): LocalRouteQuery {
  const query: LocalRouteQuery = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length <= 1 ? (values[0] ?? "") : values;
  }
  return query;
}

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw createAppError("VALIDATION_ERROR", {
      details: {
        "body.root": "Body must be valid JSON.",
      },
    });
  }
}

export function createLocalRouter(handlers: Partial<Record<LocalDomain, LocalRouteHandler>> = {}) {
  const resolvedHandlers = { ...defaultHandlers, ...handlers };

  return {
    routes: localRoutes,
    async dispatch(request: IncomingMessage) {
      const requestId = request.headers["x-request-id"]?.toString() || randomUUID();
      const method = request.method?.toUpperCase() ?? "GET";
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const match = resolveLocalRoute(method, url.pathname);

      if (!match) {
        const error = isKnownLocalPath(url.pathname)
          ? createAppError("NOT_FOUND", { requestId, message: `Unsupported method: ${method}` })
          : createAppError("NOT_FOUND", { requestId, message: `Route not found: ${method} ${url.pathname}` });

        return {
          requestId,
          domain: undefined,
          wardrobeId: undefined,
          response: createErrorResponse(error),
        };
      }

      try {
        const body = method === "GET" || method === "DELETE" ? {} : await readJsonBody(request);
        const response = await resolvedHandlers[match.domain]({
          requestId,
          method,
          pathname: url.pathname,
          path: match.params,
          query: toQueryParams(url.searchParams),
          body,
          headers: request.headers,
        });

        return {
          requestId,
          domain: match.domain,
          wardrobeId: match.params.wardrobeId,
          response,
        };
      } catch (error) {
        return {
          requestId,
          domain: match.domain,
          wardrobeId: match.params.wardrobeId,
          response: createErrorResponse(error, { requestId }),
        };
      }
    },
  };
}
