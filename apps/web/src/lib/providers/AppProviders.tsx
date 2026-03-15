"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { createAppQueryClient } from "@/lib/queryClient";

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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
