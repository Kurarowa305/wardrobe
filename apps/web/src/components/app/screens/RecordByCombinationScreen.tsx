import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByCombinationScreenProps = {
  wardrobeId: string;
};

export function RecordByCombinationScreen({ wardrobeId }: RecordByCombinationScreenProps) {
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
          { href: ROUTES.home(wardrobeId), className: "screen-link" },
          RECORD_STRINGS.byCombination.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byCombination.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
