"use client";

import { Suspense } from "react";

import { HistoryDetailScreen } from "@/components/app/screens/HistoryDetailScreen";
import { useHistoryRouteIdsFromQuery, useRedirectToWardrobeNewIfMissing } from "@/features/routing/queryParams";

function HistoryDetailPageSearchParams() {
  const { wardrobeId, historyId } = useHistoryRouteIdsFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId, historyId]);
  if (!canRender) {
    return null;
  }
  return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;
}

export default function HistoryDetailPage() {
  return (
    <Suspense fallback={null}>
      <HistoryDetailPageSearchParams />
    </Suspense>
  );
}
