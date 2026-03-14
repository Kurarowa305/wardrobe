import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type ClothingCreateScreenProps = {
  wardrobeId: string;
};

export function ClothingCreateScreen({ wardrobeId }: ClothingCreateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.clothings(wardrobeId),
      label: CLOTHING_STRINGS.create.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.create.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
