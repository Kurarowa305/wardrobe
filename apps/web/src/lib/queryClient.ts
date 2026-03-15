import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

const DEFAULT_STALE_TIME_MS = 30_000;

type CacheKey = readonly unknown[] | undefined;
type ErrorSource = "query" | "mutation";

function logReactQueryError(source: ErrorSource, error: unknown, key: CacheKey) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[tanstack-query:${source}]`, {
    key: key ? JSON.stringify(key) : "unknown",
    error,
  });
}

export function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        logReactQueryError("query", error, query.queryKey);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logReactQueryError("mutation", error, mutation.options.mutationKey);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
