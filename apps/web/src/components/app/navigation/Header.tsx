import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";

import { BackButton } from "./BackButton";
import { OverflowMenu } from "./OverflowMenu";

type HeaderAction = {
  label: string;
  href: string;
};

type HeaderProps = {
  title: string;
  backHref?: string;
  actions?: HeaderAction[];
};

export function Header({ title, backHref, actions = [] }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-side">
        {backHref ? <BackButton href={backHref} label={NAVIGATION_STRINGS.back} /> : null}
      </div>
      <h1 className="app-header-title">{title}</h1>
      <div className="app-header-side app-header-side-right">
        {actions.length > 0 ? <OverflowMenu actions={actions} /> : null}
      </div>
    </header>
  );
}
