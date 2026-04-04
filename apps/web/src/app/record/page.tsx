"use client";

import { Suspense } from "react";

import { RecordMethodScreen } from "@/components/app/screens/RecordMethodScreen";
import { DEMO_IDS } from "@/constants/routes";
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
    <Suspense fallback={<RecordMethodScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <RecordMethodPageSearchParams />
    </Suspense>
  );
}
