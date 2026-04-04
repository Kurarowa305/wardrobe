"use client";

import { Suspense } from "react";

import { RecordMethodScreen } from "@/components/app/screens/RecordMethodScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function RecordMethodPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <RecordMethodScreen wardrobeId={wardrobeId} />;
}

export default function RecordMethodPage() {
  return (
    <Suspense fallback={null}>
      <RecordMethodPageSearchParams />
    </Suspense>
  );
}
