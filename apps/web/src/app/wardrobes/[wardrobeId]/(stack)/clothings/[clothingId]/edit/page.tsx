import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function ClothingEditPage({
  params,
}: {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
}) {
  const { wardrobeId, clothingId } = await params;

  return (
    <AppShell title="服編集" backHref={routes.clothingDetail(wardrobeId, clothingId)}>
      <p>画面No.11</p>
      <ScreenLinks links={[{ href: routes.clothingDetail(wardrobeId, clothingId), label: '保存（仮）で詳細へ' }]} />
    </AppShell>
  );
}
