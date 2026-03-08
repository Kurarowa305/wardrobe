import type { ReactNode } from "react";

import { DEMO_IDS } from "@/constants/routes";

type WardrobeLayoutProps = {
  children: ReactNode;
};

export function generateStaticParams() {
  return [{ wardrobeId: DEMO_IDS.wardrobe }];
}

export default function WardrobeLayout({ children }: WardrobeLayoutProps) {
  return children;
}
