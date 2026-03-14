"use client";

import Link from "next/link";
import { createElement, useEffect, useRef } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";

type HomeTabScreenProps = {
  wardrobeId: string;
};

export function HomeTabScreen({ wardrobeId }: HomeTabScreenProps) {
  const { toast } = useToast();
  const hasShownCreatedToastRef = useRef(false);

  useEffect(() => {
    if (hasShownCreatedToastRef.current || typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("created") !== "1") {
      return;
    }

    hasShownCreatedToastRef.current = true;

    toast({
      title: HOME_STRINGS.toasts.wardrobeCreated.title,
      description: HOME_STRINGS.toasts.wardrobeCreated.description,
    });

    window.history.replaceState(window.history.state, "", ROUTES.home(wardrobeId));
  }, [toast, wardrobeId]);

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
          { href: ROUTES.recordMethod(wardrobeId), className: "screen-link" },
          HOME_STRINGS.actions.addRecord,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: ROUTES.histories(wardrobeId), className: "screen-link" },
          HOME_STRINGS.actions.viewAllHistories,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          {
            href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "home"),
            className: "screen-link",
          },
          HISTORY_STRINGS.detail.title,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: HOME_STRINGS.titlePlaceholder,
    tabKey: "home",
    wardrobeId,
    children: content,
  });
}
