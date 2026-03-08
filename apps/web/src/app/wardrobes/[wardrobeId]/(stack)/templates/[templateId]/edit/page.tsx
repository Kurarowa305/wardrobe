import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

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
      title={TEMPLATE_STRINGS.edit.title}
      backHref={ROUTES.templateDetail(wardrobeId, templateId)}
      links={[{ label: TEMPLATE_STRINGS.edit.actions.submit, href: ROUTES.templateDetail(wardrobeId, templateId) }]}
    />
  );
}
