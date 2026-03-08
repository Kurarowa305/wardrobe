import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateEditScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateEditScreen({ wardrobeId, templateId }: TemplateEditScreenProps) {
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
          { href: ROUTES.templateDetail(wardrobeId, templateId), className: "screen-link" },
          TEMPLATE_STRINGS.edit.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.edit.title,
    backHref: ROUTES.templateDetail(wardrobeId, templateId),
    children: content,
  });
}
