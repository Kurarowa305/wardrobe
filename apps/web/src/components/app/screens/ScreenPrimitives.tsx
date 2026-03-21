import Link from "next/link";

import { Button } from "@/components/ui/button";

type ScreenLinkButtonProps = {
  href: string;
  label: string;
};

export function ScreenLinkButton({ href, label }: ScreenLinkButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
