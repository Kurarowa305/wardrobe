import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

const STALE_TIME_MS = 1000 * 60;

function logError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error(`[TanStack Query][${scope}]`, error);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        logError("query", error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        logError("mutation", error);
      },
    }),
  });
}
