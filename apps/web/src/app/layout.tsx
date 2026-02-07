import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Wardrobe",
  description: "Wardrobe app",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ja">
    <body className="min-h-screen">
      {children}
    </body>
  </html>
);

export default RootLayout;
