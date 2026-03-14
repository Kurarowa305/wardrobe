import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type RecordByCombinationScreenProps = {
  wardrobeId: string;
};

export function RecordByCombinationScreen({ wardrobeId }: RecordByCombinationScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.home(wardrobeId),
      label: RECORD_STRINGS.byCombination.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byCombination.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
