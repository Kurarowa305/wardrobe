import { BackButton } from "./BackButton";

type HeaderProps = {
  title: string;
  backHref?: string;
};

export function Header({ title, backHref }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-side">{backHref ? <BackButton href={backHref} /> : null}</div>
      <h1 className="app-header-title">{title}</h1>
      <div className="app-header-side" aria-hidden="true" />
    </header>
  );
}
