import { AppShell, ScreenLinks } from '@/components/app/layout/AppShell';
import { routes } from '@/constants/routes';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ wardrobeId: string; templateId: string }>;
}) {
  const { wardrobeId, templateId } = await params;

  return (
    <AppShell title={`テンプレート詳細 (${templateId})`} backHref={routes.templates(wardrobeId)}>
      <p>画面No.8</p>
      <ScreenLinks
        links={[
          { href: routes.templateEdit(wardrobeId, templateId), label: '編集へ' },
          { href: routes.templates(wardrobeId), label: '削除（仮）で一覧へ' },
        ]}
      />
    </AppShell>
  );
}
