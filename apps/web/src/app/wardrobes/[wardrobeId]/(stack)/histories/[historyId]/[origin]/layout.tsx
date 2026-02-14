import { ReactNode } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ origin: 'home' }, { origin: 'list' }];
}

export default function OriginLayout({ children }: { children: ReactNode }) {
  return children;
}
