import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateDetailScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateDetailScreen({ wardrobeId, templateId }: TemplateDetailScreenProps) {
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
          { href: ROUTES.templateEdit(wardrobeId, templateId), className: "screen-link" },
          COMMON_STRINGS.actions.edit,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: ROUTES.templates(wardrobeId), className: "screen-link" },
          COMMON_STRINGS.actions.delete,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.detail.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
