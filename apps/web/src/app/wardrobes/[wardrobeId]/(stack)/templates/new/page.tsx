import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function TemplateNewPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;

  return (
    <AppShell title="テンプレート追加" backHref={routes.templates(wardrobeId)}>
      <p>画面No.6</p>
      <ScreenLinks links={[{ href: routes.templates(wardrobeId), label: '追加完了（仮）で一覧へ' }]} />
    </AppShell>
  );
}
