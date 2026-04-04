"use client";

import { Suspense } from "react";

import { HomeTabScreen } from "@/components/app/screens/HomeTabScreen";
import { useRedirectToWardrobeNewIfMissing, useWardrobeIdFromQuery } from "@/features/routing/queryParams";

function HomePageSearchParams() {
  const wardrobeId = useWardrobeIdFromQuery();
  const canRender = useRedirectToWardrobeNewIfMissing([wardrobeId]);
  if (!canRender) {
    return null;
  }
  return <HomeTabScreen wardrobeId={wardrobeId} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageSearchParams />
    </Suspense>
  );
}
