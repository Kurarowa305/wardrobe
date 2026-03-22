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
  icon: "edit" | "delete";
  tone?: "default" | "danger";
};

type OverflowMenuProps = {
  actions: OverflowMenuAction[];
};

function OverflowMenuItemIcon({ icon }: Pick<OverflowMenuAction, "icon">) {
  if (icon === "edit") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="overflow-menu-item-icon"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="overflow-menu-item-icon"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" />
      <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

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
          {actions.map((action) => {
            const tone = action.tone ?? "default";
            const className = `overflow-menu-item overflow-menu-item-${tone}`;
            const content = (
              <>
                <span>{action.label}</span>
                <OverflowMenuItemIcon icon={action.icon} />
              </>
            );

            return (
              <li key={action.key} role="none">
                {action.href ? (
                  <Link
                    href={action.href}
                    className={className}
                    role="menuitem"
                    aria-disabled={action.disabled}
                    onClick={(event) => {
                      if (action.disabled) {
                        event.preventDefault();
                        return;
                      }
                      handleSelectAction(action);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={className}
                    role="menuitem"
                    onClick={() => handleSelectAction(action)}
                    disabled={action.disabled}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
