"use client";

import Link from "next/link";
import { useState } from "react";

import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";

type OverflowMenuAction = {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type OverflowMenuProps = {
  actions: OverflowMenuAction[];
};

export function OverflowMenu({ actions }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAction = (action: OverflowMenuAction) => {
    if (action.disabled) {
      return;
    }

    action.onSelect?.();
    setIsOpen(false);
  };

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
            <li key={action.key} role="none">
              {action.href ? (
                <Link
                  href={action.href}
                  className="overflow-menu-item"
                  role="menuitem"
                  onClick={() => handleSelectAction(action)}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="overflow-menu-item"
                  role="menuitem"
                  onClick={() => handleSelectAction(action)}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
