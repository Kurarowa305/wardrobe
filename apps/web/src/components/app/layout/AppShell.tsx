import Link from 'next/link';
import { ReactNode } from 'react';

export type TabItem = {
  label: string;
  href: string;
};

type AppShellProps = {
  title: string;
  children?: ReactNode;
  backHref?: string;
  tabs?: TabItem[];
};

export function AppShell({ title, children, backHref, tabs }: AppShellProps) {
  return (
    <main className="shell">
      <header className="header">
        <div className="header-left">{backHref ? <Link href={backHref}>← 戻る</Link> : null}</div>
        <h1>{title}</h1>
        <div className="header-right" />
      </header>

      <section className="content">{children}</section>

      {tabs ? (
        <nav className="tabbar">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </main>
  );
}

export function ScreenLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="link-list">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
}
