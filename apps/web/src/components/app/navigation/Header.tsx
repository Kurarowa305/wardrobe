import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";

import { BackButton } from "./BackButton";

import type { ReactNode } from "react";

type HeaderProps = {
  title: string;
  backHref?: string;
  right?: ReactNode;
};

export function Header({ title, backHref, right }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-side">
        {backHref ? <BackButton href={backHref} label={NAVIGATION_STRINGS.back} /> : null}
      </div>
      <h1 className="app-header-title">{title}</h1>
      <div className="app-header-side">{right ?? <span aria-hidden="true" />}</div>
    </header>
  );
}
