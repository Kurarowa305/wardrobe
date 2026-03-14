import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

export function RecordByTemplateScreen({ wardrobeId }: RecordByTemplateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.home(wardrobeId),
      label: RECORD_STRINGS.byTemplate.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.byTemplate.title,
    backHref: ROUTES.recordMethod(wardrobeId),
    children: content,
  });
}
