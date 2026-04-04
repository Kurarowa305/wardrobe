"use client";

import { Suspense } from "react";

import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";
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
    <Suspense fallback={null}>
      <ClothingEditPageSearchParams />
    </Suspense>
  );
}
