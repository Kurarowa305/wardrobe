"use client";

import Link from "next/link";
import { useState } from "react";

import { NAVIGATION_STRINGS } from "@/constants/navigationStrings";

type HeaderActionItem = {
  label: string;
  href: string;
};

type HeaderActionButtonProps = {
  label?: string;
  items: HeaderActionItem[];
};

export function HeaderActionButton({ label = "︙", items }: HeaderActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nav-header-action-wrap">
      <button
        type="button"
        className="nav-header-action-button"
        aria-label={NAVIGATION_STRINGS.aria.headerAction}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
      </button>
      {open ? (
        <ul className="nav-header-action-menu" role="menu">
          {items.map((item) => (
            <li key={item.label} role="none">
              <Link
                href={item.href}
                className="nav-header-action-menu-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
