"use client";

import { Suspense } from "react";

import { RecordByTemplateScreen } from "@/components/app/screens/RecordByTemplateScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function RecordByTemplatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <RecordByTemplateScreen wardrobeId={wardrobeId} />;
}

export default function RecordByTemplatePage() {
  return (
    <Suspense fallback={null}>
      <RecordByTemplatePageSearchParams />
    </Suspense>
  );
}
