"use client";

import { Suspense } from "react";

import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";
import { useClothingRouteIdsFromQuery, useRedirectToWardrobeNewIfMissing } from "@/features/routing/queryParams";

function ClothingDetailPageSearchParams() {
  const { wardrobeId, clothingId } = useClothingRouteIdsFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId, clothingId]);
  if (!canRender) {
    return null;
  }
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}

export default function ClothingDetailPage() {
  return (
    <Suspense fallback={null}>
      <ClothingDetailPageSearchParams />
    </Suspense>
  );
}
