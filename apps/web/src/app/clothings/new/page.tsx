"use client";

import { Suspense } from "react";

import { ClothingCreateScreen } from "@/components/app/screens/ClothingCreateScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function ClothingCreatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <ClothingCreateScreen wardrobeId={wardrobeId} />;
}

export default function ClothingCreatePage() {
  return (
    <Suspense fallback={<ClothingCreateScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <ClothingCreatePageSearchParams />
    </Suspense>
  );
}
