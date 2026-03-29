import type { ReactNode } from "react";

type WardrobeLayoutProps = {
  children: ReactNode;
};

const STATIC_EXPORT_WARDROBE_ID = "wd_static";

export function generateStaticParams() {
  return [{ wardrobeId: STATIC_EXPORT_WARDROBE_ID }];
}

export default function WardrobeLayout({ children }: WardrobeLayoutProps) {
  return children;
}
