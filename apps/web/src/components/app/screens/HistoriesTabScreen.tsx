import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";

type HistoriesTabScreenProps = {
  wardrobeId: string;
};

export function HistoriesTabScreen({ wardrobeId }: HistoriesTabScreenProps) {
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
          {
            href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "histories"),
            className: "screen-link",
          },
          HISTORY_STRINGS.detail.title,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.list.title,
    tabKey: "histories",
    wardrobeId,
    children: content,
  });
}
