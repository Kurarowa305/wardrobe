import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";
import Link from "next/link";
import type { ReactNode } from "react";

import { ROUTES, type TabKey } from "@/constants/routes";

type TabBarProps = {
  activeTab: TabKey;
  wardrobeId: string;
};

type TabItem = {
  key: TabKey;
  label: string;
  icon: ReactNode;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-item-icon-svg">
      <path
        d="M4.5 10.5L12 4.5l7.5 6v8.25a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V15a1.5 1.5 0 0 0-3 0v3.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-item-icon-svg">
      <circle
        cx="12"
        cy="12"
        r="8.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.75V12l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-item-icon-svg">
      <rect
        x="5"
        y="7"
        width="10"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="9"
        y="5"
        width="10"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TShirtIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tab-item-icon-svg">
      <path
        d="M9 5.25 7 7.5 4.75 6l-1.5 3.75L6 11.25V18a.75.75 0 0 0 .75.75h10.5A.75.75 0 0 0 18 18v-6.75l2.75-1.5L19.25 6 17 7.5l-2-2.25H9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 5.25c.35.8 1.19 1.35 2.25 1.35s1.9-.55 2.25-1.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TAB_ITEMS: TabItem[] = [
  { key: "home", label: NAVIGATION_STRINGS.tabs.home, icon: <HomeIcon /> },
  { key: "histories", label: NAVIGATION_STRINGS.tabs.histories, icon: <ClockIcon /> },
  { key: "templates", label: NAVIGATION_STRINGS.tabs.templates, icon: <LayersIcon /> },
  { key: "clothings", label: NAVIGATION_STRINGS.tabs.clothings, icon: <TShirtIcon /> },
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
            aria-current={isActive ? "page" : undefined}
          >
            <span className="tab-item-icon">{item.icon}</span>
            <span className="tab-item-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
