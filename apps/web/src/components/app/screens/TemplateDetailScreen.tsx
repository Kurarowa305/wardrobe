import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenTextCard } from "./ScreenPrimitives";

type TemplateDetailScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateDetailScreen({ wardrobeId, templateId }: TemplateDetailScreenProps) {
  const content = createElement(ScreenTextCard, { text: "テンプレートの詳細情報" });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.detail.title,
    backHref: ROUTES.templates(wardrobeId),
    headerActions: [
      {
        label: TEMPLATE_STRINGS.detail.menu.edit,
        href: ROUTES.templateEdit(wardrobeId, templateId),
      },
      {
        label: TEMPLATE_STRINGS.detail.menu.delete,
        href: ROUTES.templates(wardrobeId),
      },
    ],
    children: content,
  });
}
