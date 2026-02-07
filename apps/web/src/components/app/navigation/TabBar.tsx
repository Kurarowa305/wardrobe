"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "ホーム" },
  { href: "/history", label: "履歴" },
  { href: "/templates", label: "テンプレート" },
  { href: "/clothes", label: "服" },
];

const TabBar = () => {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-4 gap-1 text-xs font-medium text-slate-500">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "flex items-center justify-center rounded-md px-2 py-2 transition " +
              (isActive
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default TabBar;
