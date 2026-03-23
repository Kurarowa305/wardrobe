"use client";

import { useAutoLoadOnIntersect } from "@/hooks/useAutoLoadOnIntersect";

type AutoLoadTriggerProps = {
  enabled: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loadingLabel?: string;
  idleLabel?: string;
  className?: string;
};

export function AutoLoadTrigger({
  enabled,
  isLoading,
  onLoadMore,
  loadingLabel,
  idleLabel,
  className = "py-2 text-center text-sm text-slate-500",
}: AutoLoadTriggerProps) {
  const triggerRef = useAutoLoadOnIntersect({
    enabled,
    isLoading,
    onLoadMore,
  });

  if (!enabled) {
    return null;
  }

  return (
    <div ref={triggerRef} aria-hidden={!isLoading} className={className}>
      {isLoading ? loadingLabel : idleLabel}
    </div>
  );
}
