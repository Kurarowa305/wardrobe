import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenCard } from "./ScreenPrimitives";
import { TemplateForm } from "./TemplateForm";

type TemplateEditScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateEditScreen({ wardrobeId, templateId }: TemplateEditScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(TemplateForm, {
      wardrobeId,
      mode: "edit",
      templateId,
      backHref: ROUTES.templateDetail(wardrobeId, templateId),
      submitLabel: TEMPLATE_STRINGS.edit.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.edit.title,
    backHref: ROUTES.templateDetail(wardrobeId, templateId),
    children: content,
  });
}
