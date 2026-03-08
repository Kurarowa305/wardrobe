import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingsTabScreenProps = {
  wardrobeId: string;
};

export function ClothingsTabScreen({ wardrobeId }: ClothingsTabScreenProps) {
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
          { href: ROUTES.clothingNew(wardrobeId), className: "screen-link" },
          CLOTHING_STRINGS.list.actions.add,
        ),
      ),
      createElement(
        "li",
        null,
        createElement(
          Link,
          {
            href: ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing),
            className: "screen-link",
          },
          CLOTHING_STRINGS.detail.title,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.list.title,
    tabKey: "clothings",
    wardrobeId,
    children: content,
  });
}
