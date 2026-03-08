import Link from "next/link";

import { ROUTES, type TabKey } from "@/constants/routes";

type TabBarProps = {
  activeTab: TabKey;
  wardrobeId: string;
};

const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "ホーム" },
  { key: "histories", label: "履歴" },
  { key: "templates", label: "テンプレ" },
  { key: "clothings", label: "服" },
];

function resolveTabHref(wardrobeId: string, key: TabKey) {
  if (key === "home") return ROUTES.home(wardrobeId);
  if (key === "histories") return ROUTES.histories(wardrobeId);
  if (key === "templates") return ROUTES.templates(wardrobeId);
  return ROUTES.clothings(wardrobeId);
}

export function TabBar({ activeTab, wardrobeId }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="メインタブ">
      {TAB_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={resolveTabHref(wardrobeId, item.key)}
          className={`tab-item${activeTab === item.key ? " is-active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
