import Link from "next/link";

import type { TabKey } from "@/constants/routes";

import { AppLayout } from "./AppLayout";

export type ScreenLink = {
  label: string;
  href: string;
};

type StubScreenProps = {
  title: string;
  description: string;
  backHref?: string;
  tabKey?: TabKey;
  wardrobeId?: string;
  note?: string;
  links?: ScreenLink[];
};

export function StubScreen({
  title,
  description,
  backHref,
  tabKey,
  wardrobeId,
  note,
  links = [],
}: StubScreenProps) {
  return (
    <AppLayout title={title} backHref={backHref} tabKey={tabKey} wardrobeId={wardrobeId}>
      <section className="stub-panel">
        <p className="stub-description">{description}</p>
        {note ? <p className="stub-note">{note}</p> : null}
        {links.length > 0 ? (
          <ul className="stub-link-list">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <Link href={link.href} className="stub-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </AppLayout>
  );
}
