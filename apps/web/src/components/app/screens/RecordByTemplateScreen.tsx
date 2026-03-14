import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard } from "./ScreenPrimitives";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

export function RecordByTemplateScreen({ wardrobeId }: RecordByTemplateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(
      Button,
      {
        asChild: true,
        className: "w-full justify-start text-left text-sm font-medium",
      },
      createElement(Link, { href: ROUTES.home(wardrobeId) }, RECORD_STRINGS.byTemplate.actions.submit),
    ),
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byTemplate.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
