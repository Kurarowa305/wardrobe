import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function RecordTemplatePage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;

  return (
    <AppShell title="記録（テンプレートで記録）" backHref={routes.recordMethod(wardrobeId)}>
      <p>画面No.14</p>
      <ScreenLinks links={[{ href: routes.home(wardrobeId), label: '記録完了してホームへ' }]} />
    </AppShell>
  );
}
