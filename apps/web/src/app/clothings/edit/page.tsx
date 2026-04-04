"use client";

import { Suspense } from "react";

import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useClothingRouteIdsFromQuery, useRedirectToWardrobeNewIfMissing } from "@/features/routing/queryParams";

function ClothingEditPageSearchParams() {
  const { wardrobeId, clothingId } = useClothingRouteIdsFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId, clothingId]);
  if (!canRender) {
    return null;
  }
  return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}

export default function ClothingEditPage() {
  return (
    <Suspense fallback={<ClothingEditScreen wardrobeId={DEMO_IDS.wardrobe} clothingId={DEMO_IDS.clothing} />}>
      <ClothingEditPageSearchParams />
    </Suspense>
  );
}
