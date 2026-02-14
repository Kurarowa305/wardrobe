import { ReactNode } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ historyId: 'history-1' }];
}

export default function HistoryIdLayout({ children }: { children: ReactNode }) {
  return children;
}
