import { AppShell, ScreenLinks, TabItem } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function HistoriesPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;
  const tabs: TabItem[] = [
    { label: 'ホーム', href: routes.home(wardrobeId) },
    { label: '履歴', href: routes.histories(wardrobeId) },
    { label: 'テンプレ', href: routes.templates(wardrobeId) },
    { label: '服', href: routes.clothings(wardrobeId) },
  ];

  return (
    <AppShell title="履歴一覧" tabs={tabs}>
      <p>画面No.3</p>
      <ScreenLinks links={[{ href: routes.historyDetail(wardrobeId, 'history-1', 'list'), label: '履歴詳細へ（一覧文脈）' }]} />
    </AppShell>
  );
}
