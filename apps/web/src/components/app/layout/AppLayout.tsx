import type { ReactNode } from "react";

import type { TabKey } from "@/constants/routes";

import { Header } from "../navigation/Header";
import { TabBar } from "../navigation/TabBar";

type AppLayoutProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  tabKey?: TabKey;
  wardrobeId?: string;
};

export function AppLayout({ title, children, backHref, tabKey, wardrobeId }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Header title={title} backHref={backHref} />
      <main className="app-content">{children}</main>
      {tabKey && wardrobeId ? <TabBar activeTab={tabKey} wardrobeId={wardrobeId} /> : null}
    </div>
  );
}
