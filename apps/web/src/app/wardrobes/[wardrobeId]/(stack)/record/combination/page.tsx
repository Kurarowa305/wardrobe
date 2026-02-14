import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function RecordCombinationPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;

  return (
    <AppShell title="記録（服の組み合わせで記録）" backHref={routes.recordMethod(wardrobeId)}>
      <p>画面No.15</p>
      <ScreenLinks links={[{ href: routes.home(wardrobeId), label: '記録完了してホームへ' }]} />
    </AppShell>
  );
}
