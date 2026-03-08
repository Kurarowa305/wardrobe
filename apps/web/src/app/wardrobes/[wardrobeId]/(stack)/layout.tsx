import type { ReactNode } from "react";

type StackLayoutProps = {
  children: ReactNode;
};

export default function StackLayout({ children }: StackLayoutProps) {
  return children;
}
