"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { createAppQueryClient } from "@/lib/queryClient";
import { startMockServiceWorker } from "@/mocks/start";

declare global {
  interface Window {
    __WARDROBE_QUERY_CLIENT__?: QueryClient;
  }
}

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());
  const [isMockReady, setIsMockReady] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    let isMounted = true;

    const prepare = async () => {
      try {
        await startMockServiceWorker();
      } catch (error) {
        console.error("[msw] failed to start mock service worker", error);
      } finally {
        if (isMounted) {
          setIsMockReady(true);
        }
      }
    };

    void prepare();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    window.__WARDROBE_QUERY_CLIENT__ = queryClient;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event?.query) {
        return;
      }

      console.debug("[tanstack-query:cache]", {
        event: event.type,
        hash: event.query.queryHash,
        status: event.query.state.status,
      });
    });

    return () => {
      unsubscribe();
      delete window.__WARDROBE_QUERY_CLIENT__;
    };
  }, [queryClient]);

  if (!isMockReady) {
    return null;
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
