import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";
import Link from "next/link";

import { ROUTES, type TabKey } from "@/constants/routes";

import { TabBarIcon } from "./TabBarIcon";

type TabBarProps = {
  activeTab: TabKey;
  wardrobeId: string;
};

type TabItem = {
  key: TabKey;
  label: string;
};

const TAB_ITEMS: TabItem[] = [
  {
    key: "home",
    label: NAVIGATION_STRINGS.tabs.home,
  },
  {
    key: "histories",
    label: NAVIGATION_STRINGS.tabs.histories,
  },
  {
    key: "templates",
    label: NAVIGATION_STRINGS.tabs.templates,
  },
  {
    key: "clothings",
    label: NAVIGATION_STRINGS.tabs.clothings,
  },
];

function resolveTabHref(wardrobeId: string, key: TabKey) {
  if (key === "home") return ROUTES.home(wardrobeId);
  if (key === "histories") return ROUTES.histories(wardrobeId);
  if (key === "templates") return ROUTES.templates(wardrobeId);
  return ROUTES.clothings(wardrobeId);
}

export function TabBar({ activeTab, wardrobeId }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label={NAVIGATION_STRINGS.aria.mainTab}>
      {TAB_ITEMS.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <Link
            key={item.key}
            href={resolveTabHref(wardrobeId, item.key)}
            className={`tab-item${isActive ? " is-active" : ""}`}
          >
            <TabBarIcon icon={item.key} active={isActive} className="tab-item-icon" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
