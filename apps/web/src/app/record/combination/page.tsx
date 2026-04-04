"use client";

import { Suspense } from "react";

import { RecordByCombinationScreen } from "@/components/app/screens/RecordByCombinationScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function RecordByCombinationPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <RecordByCombinationScreen wardrobeId={wardrobeId} />;
}

export default function RecordByCombinationPage() {
  return (
    <Suspense fallback={null}>
      <RecordByCombinationPageSearchParams />
    </Suspense>
  );
}
