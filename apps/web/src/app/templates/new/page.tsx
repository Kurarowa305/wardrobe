"use client";

import { Suspense } from "react";

import { TemplateCreateScreen } from "@/components/app/screens/TemplateCreateScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function TemplateCreatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <TemplateCreateScreen wardrobeId={wardrobeId} />;
}

export default function TemplateCreatePage() {
  return (
    <Suspense fallback={<TemplateCreateScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <TemplateCreatePageSearchParams />
    </Suspense>
  );
}
