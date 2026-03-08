import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingEditScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

export function ClothingEditScreen({ wardrobeId, clothingId }: ClothingEditScreenProps) {
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
          { href: ROUTES.clothingDetail(wardrobeId, clothingId), className: "screen-link" },
          CLOTHING_STRINGS.edit.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.edit.title,
    backHref: ROUTES.clothingDetail(wardrobeId, clothingId),
    children: content,
  });
}
