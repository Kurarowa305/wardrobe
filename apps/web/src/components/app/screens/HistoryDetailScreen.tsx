"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";

type HistoryDetailScreenProps = {
  wardrobeId: string;
};

export function HistoryDetailScreen({ wardrobeId }: HistoryDetailScreenProps) {
  const searchParams = useSearchParams();
  const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));
  const content = createElement(
    "section",
    { className: "screen-panel" },
    createElement(
      "ul",
      { className: "screen-link-list" },
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: backHref, className: "screen-link" },
          HISTORY_STRINGS.detail.menu.delete,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    children: content,
  });
}
