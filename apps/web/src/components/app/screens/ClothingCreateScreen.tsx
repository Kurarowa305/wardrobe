import Link from "next/link";
import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenCard } from "./ScreenPrimitives";

type ClothingCreateScreenProps = {
  wardrobeId: string;
};

export function ClothingCreateScreen({ wardrobeId }: ClothingCreateScreenProps) {
  const content = createElement(ScreenCard, {
    children: createElement(
      Button,
      {
        asChild: true,
        className: "w-full justify-start text-left text-sm font-medium",
      },
      createElement(Link, { href: ROUTES.clothings(wardrobeId) }, CLOTHING_STRINGS.create.actions.submit),
    ),
  });

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.create.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
