import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { TemplateForm } from "./TemplateForm";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

export function TemplateCreateScreen({ wardrobeId }: TemplateCreateScreenProps) {
  const content = createElement(Card, null, createElement(CardContent, { className: "p-4" }, createElement(TemplateForm, {
    wardrobeId,
    mode: "create",
    backHref: ROUTES.templates(wardrobeId),
    submitLabel: TEMPLATE_STRINGS.create.actions.submit,
  })));

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
