"use client";

import { Suspense } from "react";

import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useRedirectToWardrobeNewIfMissing, useTemplateRouteIdsFromQuery } from "@/features/routing/queryParams";

function TemplateDetailPageSearchParams() {
  const { wardrobeId, templateId } = useTemplateRouteIdsFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId, templateId]);
  if (!canRender) {
    return null;
  }
  return <TemplateDetailScreen wardrobeId={wardrobeId} templateId={templateId} />;
}

export default function TemplateDetailPage() {
  return (
    <Suspense
      fallback={<TemplateDetailScreen wardrobeId={DEMO_IDS.wardrobe} templateId={DEMO_IDS.template} />}
    >
      <TemplateDetailPageSearchParams />
    </Suspense>
  );
}
