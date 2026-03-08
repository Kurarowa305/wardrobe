import type { ReactNode } from "react";

import type { TabKey } from "@/constants/routes";

import { Header } from "../navigation/Header";
import { TabBar } from "../navigation/TabBar";

type AppLayoutProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  headerRight?: ReactNode;
  tabKey?: TabKey;
  wardrobeId?: string;
};

export function AppLayout({ title, children, backHref, headerRight, tabKey, wardrobeId }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Header title={title} backHref={backHref} right={headerRight} />
      <main className="app-content">{children}</main>
      {tabKey && wardrobeId ? <TabBar activeTab={tabKey} wardrobeId={wardrobeId} /> : null}
    </div>
  );
}
