import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;

  return (
    <StubScreen
      title="テンプレートの編集"
      backHref={ROUTES.templateDetail(wardrobeId, templateId)}
      description="テンプレート編集（スタック）。"
      note={`templateId: ${templateId}`}
      links={[{ label: "保存して詳細へ", href: ROUTES.templateDetail(wardrobeId, templateId) }]}
    />
  );
}
