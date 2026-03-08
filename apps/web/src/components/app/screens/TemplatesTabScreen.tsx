import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplatesTabScreenProps = {
  wardrobeId: string;
};

export function TemplatesTabScreen({ wardrobeId }: TemplatesTabScreenProps) {
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
          { href: ROUTES.templateNew(wardrobeId), className: "screen-link" },
          TEMPLATE_STRINGS.list.actions.add,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          {
            href: ROUTES.templateDetail(wardrobeId, DEMO_IDS.template),
            className: "screen-link",
          },
          TEMPLATE_STRINGS.detail.title,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.list.title,
    tabKey: "templates",
    wardrobeId,
    children: content,
  });
}
