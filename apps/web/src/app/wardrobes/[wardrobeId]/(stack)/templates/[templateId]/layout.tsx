import { ReactNode } from 'react';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ templateId: 'template-1' }];
}

export default function TemplateIdLayout({ children }: { children: ReactNode }) {
  return children;
}
