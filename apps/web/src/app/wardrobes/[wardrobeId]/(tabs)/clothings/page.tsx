import { AppShell, ScreenLinks, TabItem } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function ClothingsPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;
  const tabs: TabItem[] = [
    { label: 'ホーム', href: routes.home(wardrobeId) },
    { label: '履歴', href: routes.histories(wardrobeId) },
    { label: 'テンプレ', href: routes.templates(wardrobeId) },
    { label: '服', href: routes.clothings(wardrobeId) },
  ];

  return (
    <AppShell title="服一覧" tabs={tabs}>
      <p>画面No.9</p>
      <ScreenLinks
        links={[
          { href: routes.clothingNew(wardrobeId), label: '＋ 服追加へ' },
          { href: routes.clothingDetail(wardrobeId), label: '服詳細へ' },
        ]}
      />
    </AppShell>
  );
}
