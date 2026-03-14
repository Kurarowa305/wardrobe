import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type TemplatesTabScreenProps = {
  wardrobeId: string;
};

export function TemplatesTabScreen({ wardrobeId }: TemplatesTabScreenProps) {
  const content = createElement(ScreenCard, {
    children: [
      createElement(
        Button,
        {
          key: "add",
          asChild: true,
          className: "w-full justify-start text-left text-sm font-medium",
        },
        createElement(Link, { href: ROUTES.templateNew(wardrobeId) }, TEMPLATE_STRINGS.list.actions.add),
      ),
      createElement(ScreenLinkButton, {
        key: "detail",
        href: ROUTES.templateDetail(wardrobeId, DEMO_IDS.template),
        label: TEMPLATE_STRINGS.detail.title,
      }),
    ],
  });

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.list.title,
    tabKey: "templates",
    wardrobeId,
    children: content,
  });
}
