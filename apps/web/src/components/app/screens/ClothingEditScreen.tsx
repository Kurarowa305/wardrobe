import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type ClothingEditScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

export function ClothingEditScreen({ wardrobeId, clothingId }: ClothingEditScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(ScreenLinkButton, {
      href: ROUTES.clothingDetail(wardrobeId, clothingId),
      label: CLOTHING_STRINGS.edit.actions.submit,
    }),
  });

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.edit.title,
    backHref: ROUTES.clothingDetail(wardrobeId, clothingId),
    children: content,
  });
}
