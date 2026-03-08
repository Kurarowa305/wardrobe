import Link from "next/link";

export type ScreenLink = {
  label: string;
  href: string;
};

type LinkSectionProps = {
  links: ScreenLink[];
};

export function LinkSection({ links }: LinkSectionProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section className="screen-panel">
      <ul className="screen-link-list">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link href={link.href} className="screen-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
