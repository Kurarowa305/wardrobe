"use client";

import { Suspense } from "react";

import { ClothingsTabScreen } from "@/components/app/screens/ClothingsTabScreen";
import { DEMO_IDS } from "@/constants/routes";
import { useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function ClothingsPageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  return <ClothingsTabScreen wardrobeId={wardrobeId} />;
}

export default function ClothingsPage() {
  return (
    <Suspense fallback={<ClothingsTabScreen wardrobeId={DEMO_IDS.wardrobe} />}>
      <ClothingsPageSearchParams />
    </Suspense>
  );
}
