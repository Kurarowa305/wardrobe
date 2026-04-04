"use client";

import { Suspense } from "react";

import { TemplateDetailScreen } from "@/components/app/screens/TemplateDetailScreen";
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
    <Suspense fallback={null}>
      <TemplateDetailPageSearchParams />
    </Suspense>
  );
}
