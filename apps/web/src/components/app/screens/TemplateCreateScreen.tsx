import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

export function TemplateCreateScreen({ wardrobeId }: TemplateCreateScreenProps) {
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
          { href: ROUTES.templates(wardrobeId), className: "screen-link" },
          TEMPLATE_STRINGS.create.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
