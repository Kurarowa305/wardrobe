"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastKind = "default" | "error";

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind, durationMs?: number) => void;
  error: (message: string) => void;
};

const TOAST_DEFAULT_DURATION_MS = 2500;
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "default", durationMs = TOAST_DEFAULT_DURATION_MS) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((prev) => [...prev, { id, message, kind }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, durationMs);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      error: (message: string) => showToast(message, "error"),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn("toast-item", toast.kind === "error" && "toast-item--error")}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
