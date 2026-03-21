import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { TemplateForm } from "./TemplateForm";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

export function TemplateCreateScreen({
  wardrobeId,
}: TemplateCreateScreenProps) {
  const content = createElement(TemplateForm, {
    wardrobeId,
    mode: "create",
    submitLabel: TEMPLATE_STRINGS.create.actions.submit,
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
