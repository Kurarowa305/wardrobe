import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ScreenCardProps = {
  children: ReactNode;
};

type ScreenLinkButtonProps = {
  href: string;
  label: string;
};

type ScreenTextCardProps = {
  text: string;
};

export function ScreenCard({ children }: ScreenCardProps) {
  return (
    <Card>
      <CardContent className="grid gap-2 p-4">{children}</CardContent>
    </Card>
  );
}

export function ScreenLinkButton({ href, label }: ScreenLinkButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function ScreenTextCard({ text }: ScreenTextCardProps) {
  return (
    <ScreenCard>
      <p className="m-0 text-sm text-slate-700">{text}</p>
    </ScreenCard>
  );
}
