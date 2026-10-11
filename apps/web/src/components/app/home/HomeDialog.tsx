"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Shared accessible modal for the home dialogs. Background clicks never dismiss it. */
export function HomeDialog({
  title,
  children,
  onClose,
  busy = false,
  hideTitle = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  hideTitle?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const pending = useRef(busy);
  pending.current = busy;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = panel.current!;
    const focusable = () =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
        ),
      );
    (focusable()[0] ?? element).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending.current) close.current();
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0] ?? element;
        const last = items.at(-1) ?? element;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === element)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === element)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const focusin = (event: FocusEvent) => {
      if (!element.contains(event.target as Node))
        (focusable()[0] ?? element).focus();
    };
    const siblings = Array.from(document.body.children).filter(
      (child) => !child.contains(element),
    ) as HTMLElement[];
    const inert = siblings.map((child) => child.inert);
    siblings.forEach((child) => {
      child.inert = true;
    });
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", focusin);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", focusin);
      siblings.forEach((child, index) => {
        child.inert = inert[index];
      });
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>("[data-record-focus-fallback]")?.focus();
    };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        tabIndex={-1}
        className="grid max-h-[85dvh] w-full max-w-md gap-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className={hideTitle ? "sr-only" : "text-lg font-semibold"}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
