"use client";

import { Suspense } from "react";

import { TemplateEditScreen } from "@/components/app/screens/TemplateEditScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useTemplateRouteIdsFromQuery } from "@/features/routing/queryParams";

function TemplateEditPageSearchParams() {
  const { wardrobeId, templateId } = useTemplateRouteIdsFromQuery();
  return <TemplateEditScreen wardrobeId={wardrobeId} templateId={templateId} />;
}

export default function TemplateEditPage() {
  return (
    <Suspense fallback={<TemplateEditScreen wardrobeId={DEMO_IDS.wardrobe} templateId={DEMO_IDS.template} />}>
      <TemplateEditPageSearchParams />
    </Suspense>
  );
}
