import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

export function RecordByTemplateScreen({ wardrobeId }: RecordByTemplateScreenProps) {
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
          RECORD_STRINGS.byTemplate.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byTemplate.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
