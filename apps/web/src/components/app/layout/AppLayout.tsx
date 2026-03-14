import type { ReactNode } from "react";

import type { TabKey } from "@/constants/routes";

import { Header } from "../navigation/Header";
import { TabBar } from "../navigation/TabBar";

type HeaderAction = {
  label: string;
  href: string;
};

type AppLayoutProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  tabKey?: TabKey;
  wardrobeId?: string;
  headerActions?: HeaderAction[];
};

export function AppLayout({ title, children, backHref, tabKey, wardrobeId, headerActions }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Header title={title} backHref={backHref} actions={headerActions} />
      <main className="app-content">{children}</main>
      {tabKey && wardrobeId ? <TabBar activeTab={tabKey} wardrobeId={wardrobeId} /> : null}
    </div>
  );
}
