import type { ReactNode } from "react";

import type { TabKey } from "@/constants/routes";

import { Header } from "../navigation/Header";
import { TabBar } from "../navigation/TabBar";

type HeaderAction = {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  icon: "edit" | "delete";
  tone?: "default" | "danger";
};

type AppLayoutProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  tabKey?: TabKey;
  wardrobeId?: string;
  headerActions?: HeaderAction[];
  showHeader?: boolean;
};

export function AppLayout({
  title,
  children,
  backHref,
  tabKey,
  wardrobeId,
  headerActions,
  showHeader = true,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      {showHeader ? <Header title={title} backHref={backHref} actions={headerActions} /> : null}
      <main className="app-content">{children}</main>
      {tabKey && wardrobeId ? <TabBar activeTab={tabKey} wardrobeId={wardrobeId} /> : null}
    </div>
  );
}
