import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ wardrobeId: string; templateId: string }>;
}) {
  const { wardrobeId, templateId } = await params;

  return (
    <AppShell title="テンプレート編集" backHref={routes.templateDetail(wardrobeId, templateId)}>
      <p>画面No.7</p>
      <ScreenLinks links={[{ href: routes.templateDetail(wardrobeId, templateId), label: '保存（仮）で詳細へ' }]} />
    </AppShell>
  );
}
