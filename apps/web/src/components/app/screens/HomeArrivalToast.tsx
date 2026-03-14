"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useToast } from "@/components/ui/toast";

const HOME_TOAST_QUERY_KEY = "toast";
const HOME_TOAST_QUERY_VALUE = "wardrobe-created";

export function HomeArrivalToast() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    if (searchParams.get(HOME_TOAST_QUERY_KEY) !== HOME_TOAST_QUERY_VALUE) {
      return;
    }

    showToast("ワードローブを作成しました（モック）", "default", 1000);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(HOME_TOAST_QUERY_KEY);
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [searchParams, showToast]);

  return null;
}
