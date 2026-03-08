"use client";

import { useSearchParams } from "next/navigation";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { HeaderActionButton } from "@/components/app/navigation/HeaderActionButton";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";

type HistoryDetailScreenProps = {
  wardrobeId: string;
};

export function HistoryDetailScreen({ wardrobeId }: HistoryDetailScreenProps) {
  const searchParams = useSearchParams();
  const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));
  const content = createElement("section", { className: "screen-panel" });

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    headerRight: createElement(HeaderActionButton, {
      items: [{ label: HISTORY_STRINGS.detail.menu.delete, href: backHref }],
    }),
    children: content,
  });
}
