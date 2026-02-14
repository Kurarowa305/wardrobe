import { ReactNode } from 'react';
import { SAMPLE_WARDROBE_ID } from '@/constants/routes';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ wardrobeId: SAMPLE_WARDROBE_ID }];
}

export default function WardrobeLayout({ children }: { children: ReactNode }) {
  return children;
}
