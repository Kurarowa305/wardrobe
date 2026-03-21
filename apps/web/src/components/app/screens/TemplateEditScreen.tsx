import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { TemplateForm } from "./TemplateForm";

type TemplateEditScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateEditScreen({
  wardrobeId,
  templateId,
}: TemplateEditScreenProps) {
  const content = createElement(Card, {
    children: createElement(CardContent, {
      className: "grid gap-2 p-4",
      children: createElement(TemplateForm, {
        wardrobeId,
        mode: "edit",
        templateId,
        backHref: ROUTES.templateDetail(wardrobeId, templateId),
        submitLabel: TEMPLATE_STRINGS.edit.actions.submit,
      }),
    }),
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.edit.title,
    backHref: ROUTES.templateDetail(wardrobeId, templateId),
    children: content,
  });
}
