import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export function WardrobeCreateScreen() {
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
          { href: ROUTES.home(DEMO_IDS.wardrobe), className: "screen-link" },
          WARDROBE_STRINGS.create.actions.create,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: WARDROBE_STRINGS.create.title,
    children: content,
  });
}
