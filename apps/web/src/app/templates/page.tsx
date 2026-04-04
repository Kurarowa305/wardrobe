"use client";

import { Suspense } from "react";

import { TemplatesTabScreen } from "@/components/app/screens/TemplatesTabScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function TemplatesPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <TemplatesTabScreen wardrobeId={wardrobeId} />;
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesTabScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <TemplatesPageSearchParams />
    </Suspense>
  );
}
