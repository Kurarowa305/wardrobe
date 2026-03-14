import { createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { WardrobeCreateForm } from "@/components/app/screens/WardrobeCreateForm";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export function WardrobeCreateScreen() {
  const content = createElement(
    "section",
    { className: "screen-panel" },
    createElement(WardrobeCreateForm, {
      successHref: ROUTES.home(DEMO_IDS.wardrobe),
    }),
  );

  return createElement(AppLayout, {
    title: WARDROBE_STRINGS.create.title,
    children: content,
  });
}
