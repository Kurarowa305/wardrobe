import { StubScreen } from "@/components/app/layout/StubScreen";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

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
      title={TEMPLATE_STRINGS.detail.title}
      backHref={ROUTES.templates(wardrobeId)}
      links={[
        { label: COMMON_STRINGS.actions.edit, href: ROUTES.templateEdit(wardrobeId, templateId) },
        { label: COMMON_STRINGS.actions.delete, href: ROUTES.templates(wardrobeId) },
      ]}
    />
  );
}
