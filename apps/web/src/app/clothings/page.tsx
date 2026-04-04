"use client";

import { Suspense } from "react";

import { ClothingsTabScreen } from "@/components/app/screens/ClothingsTabScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function ClothingsPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <ClothingsTabScreen wardrobeId={wardrobeId} />;
}

export default function ClothingsPage() {
  return (
    <Suspense fallback={<ClothingsTabScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <ClothingsPageSearchParams />
    </Suspense>
  );
}
