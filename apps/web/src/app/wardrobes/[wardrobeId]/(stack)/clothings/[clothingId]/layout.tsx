import { ReactNode } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ clothingId: 'clothing-1' }];
}

export default function ClothingIdLayout({ children }: { children: ReactNode }) {
  return children;
}
