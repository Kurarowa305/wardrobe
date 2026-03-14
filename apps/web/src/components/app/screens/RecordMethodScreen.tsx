import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type RecordMethodScreenProps = {
  wardrobeId: string;
};

export function RecordMethodScreen({ wardrobeId }: RecordMethodScreenProps) {
  const content = createElement(ScreenCard, {
    children: [
      createElement(ScreenLinkButton, {
        key: "by-template",
        href: ROUTES.recordByTemplate(wardrobeId),
        label: RECORD_STRINGS.method.actions.byTemplate,
      }),
      createElement(ScreenLinkButton, {
        key: "by-combination",
        href: ROUTES.recordByCombination(wardrobeId),
        label: RECORD_STRINGS.method.actions.byCombination,
      }),
    ],
  });

  return createElement(AppLayout, {
    title: RECORD_STRINGS.method.title,
    backHref: ROUTES.home(wardrobeId),
    children: content,
  });
}
