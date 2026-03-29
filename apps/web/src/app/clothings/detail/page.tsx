"use client";

import { Suspense } from "react";

import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useClothingRouteIdsFromQuery } from "@/features/routing/queryParams";

function ClothingDetailPageSearchParams() {
  const { wardrobeId, clothingId } = useClothingRouteIdsFromQuery();
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}

export default function ClothingDetailPage() {
  return (
    <Suspense
      fallback={<ClothingDetailScreen wardrobeId={DEMO_IDS.wardrobe} clothingId={DEMO_IDS.clothing} />}
    >
      <ClothingDetailPageSearchParams />
    </Suspense>
  );
}
