import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function RecordMethodPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params;

  return (
    <AppShell title="記録（方法選択）" backHref={routes.home(wardrobeId)}>
      <p>画面No.13</p>
      <ScreenLinks
        links={[
          { href: routes.recordByTemplate(wardrobeId), label: 'テンプレートで記録へ' },
          { href: routes.recordByCombination(wardrobeId), label: '服の組み合わせで記録へ' },
        ]}
      />
    </AppShell>
  );
}
