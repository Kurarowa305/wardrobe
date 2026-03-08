import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingDetailScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

export function ClothingDetailScreen({ wardrobeId, clothingId }: ClothingDetailScreenProps) {
  const content = createElement(
    "section",
    { className: "screen-panel" },
    createElement(
      "ul",
      { className: "screen-link-list" },
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: ROUTES.clothingEdit(wardrobeId, clothingId), className: "screen-link" },
          COMMON_STRINGS.actions.edit,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          { href: ROUTES.clothings(wardrobeId), className: "screen-link" },
          COMMON_STRINGS.actions.delete,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.detail.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
