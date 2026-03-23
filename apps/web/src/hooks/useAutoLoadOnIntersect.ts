"use client";

import { useEffect, useRef } from "react";

type UseAutoLoadOnIntersectOptions = {
  enabled: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useAutoLoadOnIntersect({
  enabled,
  isLoading,
  onLoadMore,
  rootMargin = "0px 0px 160px 0px",
}: UseAutoLoadOnIntersectOptions) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !enabled || isLoading || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        onLoadMore();
      },
      { rootMargin },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isLoading, onLoadMore, rootMargin]);

  return targetRef;
}
