"use client";

import Link from "next/link";
import { createElement, useEffect, useRef } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

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

  const content = createElement(ScreenCard, {
    children: [
      createElement(
        Button,
        {
          key: "record",
          asChild: true,
          className: "w-full justify-start text-left text-sm font-medium",
        },
        createElement(Link, { href: ROUTES.recordMethod(wardrobeId) }, HOME_STRINGS.actions.addRecord),
      ),
      createElement(ScreenLinkButton, {
        key: "histories",
        href: ROUTES.histories(wardrobeId),
        label: HOME_STRINGS.actions.viewAllHistories,
      }),
      createElement(ScreenLinkButton, {
        key: "history-detail",
        href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "home"),
        label: HISTORY_STRINGS.detail.title,
      }),
    ],
  });

  return createElement(AppLayout, {
    title: HOME_STRINGS.titlePlaceholder,
    tabKey: "home",
    wardrobeId,
    children: content,
  });
}
