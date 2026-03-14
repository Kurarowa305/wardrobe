import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenCard, ScreenLinkButton } from "./ScreenPrimitives";

type ClothingsTabScreenProps = {
  wardrobeId: string;
};

export function ClothingsTabScreen({ wardrobeId }: ClothingsTabScreenProps) {
  const content = createElement(ScreenCard, {
    children: [
      createElement(ScreenLinkButton, {
        key: "add",
        href: ROUTES.clothingNew(wardrobeId),
        label: CLOTHING_STRINGS.list.actions.add,
      }),
      createElement(ScreenLinkButton, {
        key: "detail",
        href: ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing),
        label: CLOTHING_STRINGS.detail.title,
      }),
    ],
  });

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.list.title,
    tabKey: "clothings",
    wardrobeId,
    children: content,
  });
}
