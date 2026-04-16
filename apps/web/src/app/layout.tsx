import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/lib/providers/AppProviders";

import "./globals.css";

const APP_NAME = "Wardrobe";
const APP_DESCRIPTION = "Wardrobe app routing skeleton";
const HOME_SCREEN_ICON_192 = { url: "/icons/192.png", sizes: "192x192", type: "image/png" };
const HOME_SCREEN_ICON_512 = { url: "/icons/512.png", sizes: "512x512", type: "image/png" };

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [HOME_SCREEN_ICON_192, HOME_SCREEN_ICON_512],
    shortcut: [HOME_SCREEN_ICON_192],
    apple: [HOME_SCREEN_ICON_192],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
