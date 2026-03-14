import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenTextCard } from "./ScreenPrimitives";

type ClothingDetailScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

export function ClothingDetailScreen({ wardrobeId, clothingId }: ClothingDetailScreenProps) {
  const content = createElement(ScreenTextCard, { text: "服の詳細情報" });

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.detail.title,
    backHref: ROUTES.clothings(wardrobeId),
    headerActions: [
      {
        label: CLOTHING_STRINGS.detail.menu.edit,
        href: ROUTES.clothingEdit(wardrobeId, clothingId),
      },
      {
        label: CLOTHING_STRINGS.detail.menu.delete,
        href: ROUTES.clothings(wardrobeId),
      },
    ],
    children: content,
  });
}
