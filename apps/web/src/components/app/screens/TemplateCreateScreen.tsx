import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenCard } from "./ScreenPrimitives";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

export function TemplateCreateScreen({ wardrobeId }: TemplateCreateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(
      Button,
      {
        asChild: true,
        className: "w-full justify-start text-left text-sm font-medium",
      },
      createElement(Link, { href: ROUTES.templates(wardrobeId) }, TEMPLATE_STRINGS.create.actions.submit),
    ),
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
