import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { env } from "../../config/env.js";
import { isErrorCode, type ErrorCode } from "../../core/errors/index.js";
import { createConsoleLogger, logRequest, measureDurationMs, type StructuredLogger } from "../../core/logging/index.js";
import { createLocalRouter, type LocalDomain, type LocalRouteHandler } from "./router.js";

export type CreateLocalServerOptions = {
  host?: string;
  port?: number;
  logger?: StructuredLogger;
  handlers?: Partial<Record<LocalDomain, LocalRouteHandler>>;
};

function writeHttpResponse(response: ServerResponse, payload: { statusCode: number; headers: Record<string, string>; body: string }) {
  response.writeHead(payload.statusCode, payload.headers);
  response.end(payload.body);
}

type HandleRequestOptions = {
  logger: StructuredLogger;
  handlers?: Partial<Record<LocalDomain, LocalRouteHandler>>;
};

function extractErrorCode(response: unknown): ErrorCode | undefined {
  if (!response || typeof response !== "object" || !("json" in response)) {
    return undefined;
  }

  const json = (response as { json?: unknown }).json;
  if (!json || typeof json !== "object" || !("error" in json)) {
    return undefined;
  }

  const error = (json as { error?: unknown }).error;
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return isErrorCode(code) ? code : undefined;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, options: HandleRequestOptions) {
  if (request.url === "/health") {
    writeHttpResponse(response, {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ status: "ok", service: "api", runtime: "node" }),
    });
    return;
  }

  const startTime = Date.now();
  const router = createLocalRouter(options.handlers);
  const outcome = await router.dispatch(request);
  const statusCode = outcome.response.statusCode;

  writeHttpResponse(response, outcome.response);

  const errorCode = extractErrorCode(outcome.response);

  logRequest(
    options.logger,
    {
      requestId: outcome.requestId,
      ...(request.method ? { method: request.method.toUpperCase() } : {}),
      path: request.url ?? "/",
      ...(outcome.domain ? { domain: outcome.domain } : {}),
      ...(outcome.wardrobeId ? { wardrobeId: outcome.wardrobeId } : {}),
    },
    errorCode
      ? { statusCode, durationMs: measureDurationMs(startTime), errorCode }
      : { statusCode, durationMs: measureDurationMs(startTime) },
  );
}

export function createLocalServerDescriptor(options: CreateLocalServerOptions = {}) {
  const router = createLocalRouter(options.handlers);
  return {
    host: options.host ?? env.host,
    port: options.port ?? env.port,
    routes: router.routes,
  };
}

export function createLocalServer(options: CreateLocalServerOptions = {}): Server {
  const logger = options.logger ?? createConsoleLogger();

  return createServer((request, response) => {
    void handleRequest(request, response, {
      logger,
      ...(options.handlers ? { handlers: options.handlers } : {}),
    });
  });
}
