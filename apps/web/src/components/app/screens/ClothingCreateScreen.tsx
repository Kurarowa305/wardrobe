import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingCreateScreenProps = {
  wardrobeId: string;
};

export function ClothingCreateScreen({ wardrobeId }: ClothingCreateScreenProps) {
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
          { href: ROUTES.clothings(wardrobeId), className: "screen-link" },
          CLOTHING_STRINGS.create.actions.submit,
        ),
      ),
    ),
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.create.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
