"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { isWardrobeId } from "@/api/schemas/wardrobe";
import { ROUTES } from "@/constants/routes";

function resolveQueryParam(searchParams: ReadonlyURLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveWardrobeId(searchParams: ReadonlyURLSearchParams) {
  const wardrobeId = resolveQueryParam(searchParams, "wardrobeId");
  if (!wardrobeId) {
    return null;
  }

  return isWardrobeId(wardrobeId) ? wardrobeId : null;
}

export function useWardrobeIdFromQuery() {
  const searchParams = useSearchParams();
  return resolveWardrobeId(searchParams) ?? "";
}

export function useHistoryRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveWardrobeId(searchParams) ?? "",
    historyId: resolveQueryParam(searchParams, "historyId") ?? "",
  };
}

export function useTemplateRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveWardrobeId(searchParams) ?? "",
    templateId: resolveQueryParam(searchParams, "templateId") ?? "",
  };
}

export function useClothingRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  return {
    wardrobeId: resolveWardrobeId(searchParams) ?? "",
    clothingId: resolveQueryParam(searchParams, "clothingId") ?? "",
  };
}

export function useRedirectToWardrobeNewIfMissing(ids: string[]) {
  const router = useRouter();
  const hasMissing = ids.some((value) => value.trim().length === 0);

  useEffect(() => {
    if (!hasMissing) {
      return;
    }

    router.replace(ROUTES.wardrobeNew);
  }, [hasMissing, router]);

  return !hasMissing;
}
