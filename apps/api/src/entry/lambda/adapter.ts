import { createAppError } from "../../core/errors/index.js";
import { createErrorResponse, createSuccessResponse, type JsonResponse } from "../../core/response/index.js";
import type { LocalDomain, LocalRouteHandler, LocalRouteQuery } from "../local/router.js";
import { createHistoryHandler } from "../../domains/history/handlers/createHistoryHandler.js";
import { deleteHistoryHandler } from "../../domains/history/handlers/deleteHistoryHandler.js";
import { createWardrobeHandler } from "../../domains/wardrobe/handlers/createWardrobeHandler.js";
import { getWardrobeHandler } from "../../domains/wardrobe/handlers/getWardrobeHandler.js";
import { listClothingHandler } from "../../domains/clothing/handlers/listClothingHandler.js";
import { createClothingHandler } from "../../domains/clothing/handlers/createClothingHandler.js";
import { getClothingHandler } from "../../domains/clothing/handlers/getClothingHandler.js";
import { updateClothingHandler } from "../../domains/clothing/handlers/updateClothingHandler.js";
import { deleteClothingHandler } from "../../domains/clothing/handlers/deleteClothingHandler.js";

export type LambdaEvent = {
  version?: string;
  routeKey?: string;
  rawPath?: string;
  rawQueryString?: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  pathParameters?: Record<string, string | undefined> | null;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
    requestId?: string;
  };
  body?: string | null;
  isBase64Encoded?: boolean;
};

export type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function createDefaultDomainHandler(domain: LocalDomain): LocalRouteHandler {
  return (request) => createSuccessResponse({
    ok: true,
    domain,
    method: request.method,
    path: request.path,
  });
}

export const sharedDomainHandlers: Record<LocalDomain, LocalRouteHandler> = {
  wardrobe(request) {
    if (request.method === "POST" && request.pathname === "/wardrobes") {
      return createWardrobeHandler({
        body: request.body,
        headers: request.headers,
        requestId: request.requestId,
      });
    }

    if (request.method === "GET" && request.path.wardrobeId) {
      return getWardrobeHandler({
        path: request.path,
        requestId: request.requestId,
      });
    }

    return createDefaultDomainHandler("wardrobe")(request);
  },
  clothing(request) {
    if (request.method === "POST" && request.pathname === `/wardrobes/${request.path.wardrobeId}/clothing`) {
      return createClothingHandler({
        path: request.path,
        body: request.body,
        headers: request.headers,
        requestId: request.requestId,
      });
    }

    if (request.method === "GET" && request.path.clothingId) {
      return getClothingHandler({
        path: request.path,
        requestId: request.requestId,
      });
    }

    if (request.method === "GET" && request.pathname === `/wardrobes/${request.path.wardrobeId}/clothing`) {
      return listClothingHandler({
        path: request.path,
        query: request.query,
        requestId: request.requestId,
      });
    }

    if (request.method === "PATCH" && request.path.clothingId) {
      return updateClothingHandler({
        path: request.path,
        body: request.body,
        headers: request.headers,
        requestId: request.requestId,
      });
    }

    if (request.method === "DELETE" && request.path.clothingId) {
      return deleteClothingHandler({
        path: request.path,
        requestId: request.requestId,
      });
    }

    return createDefaultDomainHandler("clothing")(request);
  },
  template: createDefaultDomainHandler("template"),
  history(request) {
    if (request.method === "POST" && request.pathname === `/wardrobes/${request.path.wardrobeId}/histories`) {
      return createHistoryHandler({
        path: request.path,
        body: request.body,
        requestId: request.requestId,
      });
    }

    if (request.method === "DELETE" && request.path.historyId) {
      return deleteHistoryHandler({
        path: request.path,
        requestId: request.requestId,
      });
    }

    return createDefaultDomainHandler("history")(request);
  },
  presign: createDefaultDomainHandler("presign"),
};

function decodeBody(event: LambdaEvent): unknown {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  if (!rawBody.trim()) {
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

function normalizeHeaders(headers: LambdaEvent["headers"]): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value !== undefined) {
      normalized[key.toLowerCase()] = value;
    }
  }
  return normalized;
}

function toQuery(queryStringParameters: LambdaEvent["queryStringParameters"], rawQueryString?: string): LocalRouteQuery {
  const query: LocalRouteQuery = {};

  if (rawQueryString) {
    const searchParams = new URLSearchParams(rawQueryString);
    for (const key of new Set(searchParams.keys())) {
      const values = searchParams.getAll(key);
      query[key] = values.length <= 1 ? (values[0] ?? "") : values;
    }
    return query;
  }

  for (const [key, value] of Object.entries(queryStringParameters ?? {})) {
    if (value !== undefined) {
      query[key] = value;
    }
  }

  return query;
}

export type LambdaAdapterOptions = {
  domain: LocalDomain;
  handler?: LocalRouteHandler;
};

export function createLambdaHandler(options: LambdaAdapterOptions) {
  const handler = options.handler ?? sharedDomainHandlers[options.domain];

  return async function lambdaHandler(event: LambdaEvent): Promise<LambdaResponse> {
    const headers = normalizeHeaders(event.headers);
    const method = event.requestContext?.http?.method?.toUpperCase() ?? "GET";
    const pathname = event.rawPath ?? event.requestContext?.http?.path ?? "/";
    const requestId = headers["x-request-id"] ?? event.requestContext?.requestId ?? "lambda-request";
    const path: Record<string, string> = {};
    for (const [key, value] of Object.entries(event.pathParameters ?? {})) {
      if (value !== undefined) {
        path[key] = value;
      }
    }

    try {
      const body = method === "GET" || method === "DELETE" ? {} : decodeBody(event);
      const response = await handler({
        requestId,
        method,
        pathname,
        path,
        query: toQuery(event.queryStringParameters, event.rawQueryString),
        body,
        headers,
      });

      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      };
    } catch (error) {
      const response = createErrorResponse(error, { requestId });
      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      };
    }
  };
}

export async function invokeLambdaJson<T>(
  handler: (event: LambdaEvent) => Promise<LambdaResponse>,
  event: LambdaEvent,
): Promise<{ response: LambdaResponse; json: T }> {
  const response = await handler(event);
  return {
    response,
    json: JSON.parse(response.body) as T,
  };
}
