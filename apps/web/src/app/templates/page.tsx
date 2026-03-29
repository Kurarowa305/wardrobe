"use client";

import { Suspense } from "react";

import { TemplatesTabScreen } from "@/components/app/screens/TemplatesTabScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function TemplatesPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <TemplatesTabScreen wardrobeId={wardrobeId} />;
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesTabScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <TemplatesPageSearchParams />
    </Suspense>
  );
}
