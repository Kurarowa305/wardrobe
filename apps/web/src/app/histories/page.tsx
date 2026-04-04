"use client";

import { Suspense } from "react";

import { HistoriesTabScreen } from "@/components/app/screens/HistoriesTabScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function HistoriesPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <HistoriesTabScreen wardrobeId={wardrobeId} />;
}

export default function HistoriesPage() {
  return (
    <Suspense fallback={null}>
      <HistoriesPageSearchParams />
    </Suspense>
  );
}
