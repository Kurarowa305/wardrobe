import type { ReactNode } from "react";

type AppLayoutProps = {
  header: ReactNode;
  children: ReactNode;
  tabBar?: ReactNode;
};

const AppLayout = ({ header, children, tabBar }: AppLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-white">
    <div className="border-b border-slate-200 bg-white px-4 py-3">
      {header}
    </div>
    <main className="flex-1 overflow-hidden">{children}</main>
    {tabBar ? (
      <div className="border-t border-slate-200 bg-white px-4 py-2">
        {tabBar}
      </div>
    ) : null}
  </div>
);

export default AppLayout;
