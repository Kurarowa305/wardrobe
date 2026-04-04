"use client";

import { Suspense } from "react";

import { ClothingsTabScreen } from "@/components/app/screens/ClothingsTabScreen";
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
    <Suspense fallback={null}>
      <ClothingsPageSearchParams />
    </Suspense>
  );
}
