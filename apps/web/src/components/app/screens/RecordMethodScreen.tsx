import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard } from "./ScreenPrimitives";

type RecordMethodScreenProps = {
  wardrobeId: string;
};

export function RecordMethodScreen({ wardrobeId }: RecordMethodScreenProps) {
  const content = createElement(ScreenCard, {
    children: [
      createElement(
        Button,
        {
          key: "by-template",
          asChild: true,
          className: "w-full justify-start text-left text-sm font-medium",
        },
        createElement(Link, { href: ROUTES.recordByTemplate(wardrobeId) }, RECORD_STRINGS.method.actions.byTemplate),
      ),
      createElement(
        Button,
        {
          key: "by-combination",
          asChild: true,
          className: "w-full justify-start text-left text-sm font-medium",
        },
        createElement(
          Link,
          { href: ROUTES.recordByCombination(wardrobeId) },
          RECORD_STRINGS.method.actions.byCombination,
        ),
      ),
    ],
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.method.title,
    backHref: ROUTES.home(wardrobeId),
    children: content,
  });
}
