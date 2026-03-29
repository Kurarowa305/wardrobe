"use client";

import { Suspense } from "react";

import { HistoriesTabScreen } from "@/components/app/screens/HistoriesTabScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function HistoriesPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <HistoriesTabScreen wardrobeId={wardrobeId} />;
}

export default function HistoriesPage() {
  return (
    <Suspense fallback={<HistoriesTabScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <HistoriesPageSearchParams />
    </Suspense>
  );
}
