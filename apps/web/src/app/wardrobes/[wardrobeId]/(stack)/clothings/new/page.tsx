import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function ClothingNewPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;

  return (
    <AppShell title="服追加" backHref={routes.clothings(wardrobeId)}>
      <p>画面No.10</p>
      <ScreenLinks links={[{ href: routes.clothings(wardrobeId), label: '追加完了（仮）で一覧へ' }]} />
    </AppShell>
  );
}
