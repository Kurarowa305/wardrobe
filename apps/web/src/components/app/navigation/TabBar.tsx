import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";
import Image from "next/image";
import Link from "next/link";

import { ROUTES, type TabKey } from "@/constants/routes";

type TabBarProps = {
  activeTab: TabKey;
  wardrobeId: string;
};

type TabItem = {
  key: TabKey;
  label: string;
  activeIconSrc: string;
  inactiveIconSrc: string;
};

const TAB_ITEMS: TabItem[] = [
  {
    key: "home",
    label: NAVIGATION_STRINGS.tabs.home,
    activeIconSrc: "/icons/home_active.png",
    inactiveIconSrc: "/icons/home_inactive.png",
  },
  {
    key: "histories",
    label: NAVIGATION_STRINGS.tabs.histories,
    activeIconSrc: "/icons/history_active.png",
    inactiveIconSrc: "/icons/history_inactive.png",
  },
  {
    key: "templates",
    label: NAVIGATION_STRINGS.tabs.templates,
    activeIconSrc: "/icons/template_active.png",
    inactiveIconSrc: "/icons/template_inactive.png",
  },
  {
    key: "clothings",
    label: NAVIGATION_STRINGS.tabs.clothings,
    activeIconSrc: "/icons/cloth_active.png",
    inactiveIconSrc: "/icons/cloth_inactive.png",
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
            <Image
              src={isActive ? item.activeIconSrc : item.inactiveIconSrc}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="tab-item-icon"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
