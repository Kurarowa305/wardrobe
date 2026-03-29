"use client";

import { Suspense } from "react";

import { RecordByTemplateScreen } from "@/components/app/screens/RecordByTemplateScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function RecordByTemplatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <RecordByTemplateScreen wardrobeId={wardrobeId} />;
}

export default function RecordByTemplatePage() {
  return (
    <Suspense fallback={<RecordByTemplateScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <RecordByTemplatePageSearchParams />
    </Suspense>
  );
}
