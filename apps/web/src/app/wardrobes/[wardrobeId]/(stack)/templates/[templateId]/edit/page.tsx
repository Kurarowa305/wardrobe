import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
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
    <AppLayout title={TEMPLATE_STRINGS.edit.title} backHref={ROUTES.templateDetail(wardrobeId, templateId)}>
      <LinkSection
        links={[{ label: TEMPLATE_STRINGS.edit.actions.submit, href: ROUTES.templateDetail(wardrobeId, templateId) }]}
      />
    </AppLayout>
  );
}
