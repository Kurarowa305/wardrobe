import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ wardrobeId: string; historyId: string; origin: 'home' | 'list' }>;
}) {
  const { wardrobeId, historyId, origin } = await params;
  const backHref = origin === 'home' ? routes.home(wardrobeId) : routes.histories(wardrobeId);

  return (
    <AppShell title={`履歴詳細 (${historyId})`} backHref={backHref}>
      <p>画面No.4</p>
      <ScreenLinks links={[{ href: backHref, label: '削除完了（仮）で戻る' }]} />
    </AppShell>
  );
}
