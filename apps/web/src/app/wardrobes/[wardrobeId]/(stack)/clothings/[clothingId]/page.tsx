import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function ClothingDetailPage({
  params,
}: {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
}) {
  const { wardrobeId, clothingId } = await params;

  return (
    <AppShell title={`服詳細 (${clothingId})`} backHref={routes.clothings(wardrobeId)}>
      <p>画面No.12</p>
      <ScreenLinks
        links={[
          { href: routes.clothingEdit(wardrobeId, clothingId), label: '編集へ' },
          { href: routes.clothings(wardrobeId), label: '削除（仮）で一覧へ' },
        ]}
      />
    </AppShell>
  );
}
