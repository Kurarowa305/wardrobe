import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "Wardrobe",
  description: "Wardrobe app routing skeleton",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
