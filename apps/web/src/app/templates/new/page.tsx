"use client";

import { Suspense } from "react";

import { TemplateCreateScreen } from "@/components/app/screens/TemplateCreateScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function TemplateCreatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <TemplateCreateScreen wardrobeId={wardrobeId} />;
}

export default function TemplateCreatePage() {
  return (
    <Suspense fallback={<TemplateCreateScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <TemplateCreatePageSearchParams />
    </Suspense>
  );
}
