"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { isWardrobeId } from "@/api/schemas/wardrobe";
import { ROUTES } from "@/constants/routes";
import { writeLastWardrobeId } from "@/features/routing/lastWardrobeStorage";

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

function usePersistWardrobeId(wardrobeId: string | null) {
  useEffect(() => {
    if (!wardrobeId) {
      return;
    }

    writeLastWardrobeId(wardrobeId);
  }, [wardrobeId]);
}

export function useWardrobeIdFromQuery() {
  const searchParams = useSearchParams();
  const wardrobeId = resolveWardrobeId(searchParams);
  usePersistWardrobeId(wardrobeId);
  return wardrobeId ?? "";
}

export function useHistoryRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  const wardrobeId = resolveWardrobeId(searchParams);
  usePersistWardrobeId(wardrobeId);
  return {
    wardrobeId: wardrobeId ?? "",
    historyId: resolveQueryParam(searchParams, "historyId") ?? "",
  };
}

export function useTemplateRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  const wardrobeId = resolveWardrobeId(searchParams);
  usePersistWardrobeId(wardrobeId);
  return {
    wardrobeId: wardrobeId ?? "",
    templateId: resolveQueryParam(searchParams, "templateId") ?? "",
  };
}

export function useClothingRouteIdsFromQuery() {
  const searchParams = useSearchParams();
  const wardrobeId = resolveWardrobeId(searchParams);
  usePersistWardrobeId(wardrobeId);
  return {
    wardrobeId: wardrobeId ?? "",
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
