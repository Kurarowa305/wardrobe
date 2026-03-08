import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type TemplateDetailPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;

  return (
    <StubScreen
      title="テンプレートの詳細"
      backHref={ROUTES.templates(wardrobeId)}
      description="テンプレート詳細（スタック）。"
      note={`templateId: ${templateId}`}
      links={[
        { label: "編集へ", href: ROUTES.templateEdit(wardrobeId, templateId) },
        { label: "削除して一覧へ", href: ROUTES.templates(wardrobeId) },
      ]}
    />
  );
}
