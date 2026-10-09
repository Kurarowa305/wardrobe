"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HomePrototype } from "@/components/app/screens/home-prototype/HomePrototype";

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

function HomeEntry() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant");
  if (process.env.NODE_ENV === "development" && variant) {
    return <HomePrototype initialVariant={variant} />;
  }
  return <HomePageSearchParams />;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeEntry />
    </Suspense>
  );
}
