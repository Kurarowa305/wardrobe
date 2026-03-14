"use client";

import Link from "next/link";
import { createElement, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";

type HomeTabScreenProps = {
  wardrobeId: string;
  showCreatedToast?: boolean;
};

export function HomeTabScreen({ wardrobeId, showCreatedToast = false }: HomeTabScreenProps) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!showCreatedToast) {
      return;
    }

    toast({
      title: HOME_STRINGS.toasts.wardrobeCreated.title,
      description: HOME_STRINGS.toasts.wardrobeCreated.description,
    });

    router.replace(ROUTES.home(wardrobeId));
  }, [router, showCreatedToast, toast, wardrobeId]);

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
