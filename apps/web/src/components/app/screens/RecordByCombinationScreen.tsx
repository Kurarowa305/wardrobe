import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard } from "./ScreenPrimitives";

type RecordByCombinationScreenProps = {
  wardrobeId: string;
};

export function RecordByCombinationScreen({ wardrobeId }: RecordByCombinationScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(
      Button,
      {
        asChild: true,
        className: "w-full justify-start text-left text-sm font-medium",
      },
      createElement(Link, { href: ROUTES.home(wardrobeId) }, RECORD_STRINGS.byCombination.actions.submit),
    ),
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byCombination.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
