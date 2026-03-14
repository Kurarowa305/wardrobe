"use client";

import { useSearchParams } from "next/navigation";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { ScreenTextCard } from "./ScreenPrimitives";

type HistoryDetailScreenProps = {
  wardrobeId: string;
};

export function HistoryDetailScreen({ wardrobeId }: HistoryDetailScreenProps) {
  const searchParams = useSearchParams();
  const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));
  const content = createElement(ScreenTextCard, { text: "履歴の詳細情報" });

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    headerActions: [
      {
        label: HISTORY_STRINGS.detail.menu.delete,
        href: backHref,
      },
    ],
    children: content,
  });
}
