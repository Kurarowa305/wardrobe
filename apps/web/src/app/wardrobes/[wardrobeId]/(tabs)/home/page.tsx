import { AppShell, ScreenLinks, TabItem } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function HomePage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;
  const tabs: TabItem[] = [
    { label: 'ホーム', href: routes.home(wardrobeId) },
    { label: '履歴', href: routes.histories(wardrobeId) },
    { label: 'テンプレ', href: routes.templates(wardrobeId) },
    { label: '服', href: routes.clothings(wardrobeId) },
  ];

  return (
    <AppShell title="ホーム" tabs={tabs}>
      <p>画面No.2</p>
      <ScreenLinks
        links={[
          { href: routes.recordMethod(wardrobeId), label: '＋ 着た記録（方法選択）へ' },
          { href: routes.historyDetail(wardrobeId, 'history-1', 'home'), label: '履歴詳細へ（ホーム文脈）' },
        ]}
      />
    </AppShell>
  );
}
