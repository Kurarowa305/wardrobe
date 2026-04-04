"use client";

import { Suspense } from "react";

import { ClothingCreateScreen } from "@/components/app/screens/ClothingCreateScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function ClothingCreatePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <ClothingCreateScreen wardrobeId={wardrobeId} />;
}

export default function ClothingCreatePage() {
  return (
    <Suspense fallback={null}>
      <ClothingCreatePageSearchParams />
    </Suspense>
  );
}
