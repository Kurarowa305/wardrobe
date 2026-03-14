import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { HomeArrivalToast } from "@/components/app/screens/HomeArrivalToast";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";

type HomeTabScreenProps = {
  wardrobeId: string;
};

export function HomeTabScreen({ wardrobeId }: HomeTabScreenProps) {
  const content = createElement(
    "div",
    null,
    createElement(HomeArrivalToast),
    createElement(
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
    ),
  );

  return createElement(AppLayout, {
    title: HOME_STRINGS.titlePlaceholder,
    tabKey: "home",
    wardrobeId,
    children: content,
  });
}
