"use client";

import { Suspense } from "react";

import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";
import { useRedirectToWardrobeNewIfMissing, useTemplateRouteIdsFromQuery } from "@/features/routing/queryParams";

function TemplateEditPageSearchParams() {
  const { wardrobeId, templateId } = useTemplateRouteIdsFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId, templateId]);
  if (!canRender) {
    return null;
  }
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}

export default function TemplateEditPage() {
  return (
    <Suspense fallback={null}>
      <TemplateEditPageSearchParams />
    </Suspense>
  );
}
