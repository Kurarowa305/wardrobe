"use client";

import Link from "next/link";
import { useState } from "react";

import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";

type OverflowMenuAction = {
  label: string;
  href: string;
};

type OverflowMenuProps = {
  actions: OverflowMenuAction[];
};

export function OverflowMenu({ actions }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-menu">
      <button
        type="button"
        className="overflow-menu-trigger"
        aria-label={NAVIGATION_STRINGS.aria.openOverflowMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span aria-hidden="true">︙</span>
      </button>
      {isOpen ? (
        <ul className="overflow-menu-list" role="menu">
          {actions.map((action) => (
            <li key={action.href} role="none">
              <Link
                href={action.href}
                className="overflow-menu-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
