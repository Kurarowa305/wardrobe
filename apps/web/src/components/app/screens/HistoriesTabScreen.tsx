import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type HistoriesTabScreenProps = {
  wardrobeId: string;
};

export function HistoriesTabScreen({ wardrobeId }: HistoriesTabScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "histories"),
      label: HISTORY_STRINGS.detail.title,
    }),
  });

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.list.title,
    tabKey: "histories",
    wardrobeId,
    children: content,
  });
}
