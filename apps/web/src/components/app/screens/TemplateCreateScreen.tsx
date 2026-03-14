import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

export function TemplateCreateScreen({ wardrobeId }: TemplateCreateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.templates(wardrobeId),
      label: TEMPLATE_STRINGS.create.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
