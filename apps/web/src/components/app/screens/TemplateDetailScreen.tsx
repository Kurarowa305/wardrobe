import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { HeaderActionButton } from "@/components/app/navigation/HeaderActionButton";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateDetailScreenProps = {
  wardrobeId: string;
  templateId: string;
};

export function TemplateDetailScreen({ wardrobeId, templateId }: TemplateDetailScreenProps) {
  const content = createElement("section", { className: "screen-panel" });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.detail.title,
    backHref: ROUTES.templates(wardrobeId),
    headerRight: createElement(HeaderActionButton, {
      items: [
        { label: TEMPLATE_STRINGS.detail.menu.edit, href: ROUTES.templateEdit(wardrobeId, templateId) },
        { label: TEMPLATE_STRINGS.detail.menu.delete, href: ROUTES.templates(wardrobeId) },
      ],
    }),
    children: content,
  });
}
