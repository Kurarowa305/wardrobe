import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordMethodScreenProps = {
  wardrobeId: string;
};

export function RecordMethodScreen({ wardrobeId }: RecordMethodScreenProps) {
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
          { href: ROUTES.recordByTemplate(wardrobeId), className: "screen-link" },
          RECORD_STRINGS.method.actions.byTemplate,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: ROUTES.recordByCombination(wardrobeId), className: "screen-link" },
          RECORD_STRINGS.method.actions.byCombination,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: RECORD_STRINGS.method.title,
    backHref: ROUTES.home(wardrobeId),
    children: content,
  });
}
