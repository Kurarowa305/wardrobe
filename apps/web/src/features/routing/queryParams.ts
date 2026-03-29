"use client";

import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { DEMO_IDS } from "@/constants/routes";

function resolveQueryParam(searchParams: ReadonlyURLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function useWardrobeIdFromQuery() {
  const searchParams = useSearchParams();
  return resolveQueryParam(searchParams, "wardrobeId") ?? DEMO_IDS.wardrobe;
}

export function useHistoryRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveQueryParam(searchParams, "wardrobeId") ?? DEMO_IDS.wardrobe,
    historyId: resolveQueryParam(searchParams, "historyId") ?? DEMO_IDS.history,
  };
}

export function useTemplateRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveQueryParam(searchParams, "wardrobeId") ?? DEMO_IDS.wardrobe,
    templateId: resolveQueryParam(searchParams, "templateId") ?? DEMO_IDS.template,
  };
}

export function useClothingRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveQueryParam(searchParams, "wardrobeId") ?? DEMO_IDS.wardrobe,
    clothingId: resolveQueryParam(searchParams, "clothingId") ?? DEMO_IDS.clothing,
  };
}
