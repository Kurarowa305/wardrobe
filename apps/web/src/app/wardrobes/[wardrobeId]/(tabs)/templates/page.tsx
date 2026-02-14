import { AppShell, ScreenLinks, TabItem } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function TemplatesPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;
  const tabs: TabItem[] = [
    { label: 'ホーム', href: routes.home(wardrobeId) },
    { label: '履歴', href: routes.histories(wardrobeId) },
    { label: 'テンプレ', href: routes.templates(wardrobeId) },
    { label: '服', href: routes.clothings(wardrobeId) },
  ];

  return (
    <AppShell title="テンプレート一覧" tabs={tabs}>
      <p>画面No.5</p>
      <ScreenLinks
        links={[
          { href: routes.templateNew(wardrobeId), label: '＋ テンプレート追加へ' },
          { href: routes.templateDetail(wardrobeId), label: 'テンプレート詳細へ' },
        ]}
      />
    </AppShell>
  );
}
