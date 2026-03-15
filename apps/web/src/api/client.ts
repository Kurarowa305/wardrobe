import {
  AppError,
  createTimeoutError,
  normalizeApiError,
  normalizeUnknownError,
} from "@/lib/error/normalize";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_ACCEPT_HEADER = "application/json";
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

type PrimitiveQueryValue = string | number | boolean;
export type QueryValue = PrimitiveQueryValue | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

type BaseRequestOptions = {
  headers?: HeadersInit;
  query?: QueryParams;
  signal?: AbortSignal;
  timeoutMs?: number;
  credentials?: RequestCredentials;
};

type BodyRequestOptions<TBody> = BaseRequestOptions & {
  body?: TBody;
};

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiClientConfig = {
  baseUrl?: string;
  timeoutMs?: number;
};

type ResolvedApiClientConfig = {
  baseUrl: string;
  timeoutMs: number;
};

export type ApiClient = {
  get<TResponse>(path: string, options?: BaseRequestOptions): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    path: string,
    options?: BodyRequestOptions<TBody>,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    path: string,
    options?: BodyRequestOptions<TBody>,
  ): Promise<TResponse>;
  delete<TResponse, TBody = unknown>(
    path: string,
    options?: BodyRequestOptions<TBody>,
  ): Promise<TResponse>;
};

type RequestSignalHandle = {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
};

function appendQuery(searchParams: URLSearchParams, key: string, value: QueryValue) {
  if (value === null || value === undefined) {
    return;
  }
  searchParams.append(key, String(value));
}

function buildQueryString(query?: QueryParams): string {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const element of value) {
        appendQuery(searchParams, key, element);
      }
      continue;
    }
    appendQuery(searchParams, key, value);
  }

  return searchParams.toString();
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(path: string, query: QueryParams | undefined, baseUrl: string): string {
  const normalizedPath = normalizePath(path);
  const queryString = buildQueryString(query);

  if (!baseUrl) {
    return queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(normalizedPath.slice(1), normalizedBaseUrl);
  if (queryString) {
    url.search = queryString;
  }
  return url.toString();
}

function createRequestSignal(timeoutMs: number, externalSignal?: AbortSignal): RequestSignalHandle {
  const controller = new AbortController();
  let timedOut = false;

  const onAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onAbort);
      }
    },
  };
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (raw.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new AppError({
      code: "INVALID_RESPONSE",
      status: response.status,
      message: "レスポンスJSONの解析に失敗しました。",
      details: { bodyPreview: raw.slice(0, 300) },
      originalError: error,
    });
  }
}

async function request<TResponse, TBody>(
  method: RequestMethod,
  path: string,
  options: BaseRequestOptions | BodyRequestOptions<TBody> | undefined,
  config: ResolvedApiClientConfig,
): Promise<TResponse> {
  const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
  const requestSignal = createRequestSignal(timeoutMs, options?.signal);
  const url = buildUrl(path, options?.query, config.baseUrl);
  const headers = new Headers(options?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", DEFAULT_ACCEPT_HEADER);
  }

  const maybeBody = options && "body" in options ? options.body : undefined;
  const hasBody = maybeBody !== undefined;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(maybeBody) : undefined,
      signal: requestSignal.signal,
      credentials: options?.credentials,
    });
    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw normalizeApiError(response, payload);
    }

    return payload as TResponse;
  } catch (error) {
    if (requestSignal.didTimeout()) {
      throw createTimeoutError(timeoutMs, error);
    }
    throw normalizeUnknownError(error, "APIリクエストに失敗しました。");
  } finally {
    requestSignal.cleanup();
  }
}

export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  const resolved: ResolvedApiClientConfig = {
    baseUrl: config.baseUrl?.trim() ?? DEFAULT_API_BASE_URL,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };

  return {
    get: (path, options) => request("GET", path, options, resolved),
    post: (path, options) => request("POST", path, options, resolved),
    put: (path, options) => request("PUT", path, options, resolved),
    delete: (path, options) => request("DELETE", path, options, resolved),
  };
}

export const apiClient = createApiClient();
