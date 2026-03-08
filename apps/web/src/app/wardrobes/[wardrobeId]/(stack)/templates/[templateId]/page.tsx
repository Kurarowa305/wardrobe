import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
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
    <AppLayout title={TEMPLATE_STRINGS.detail.title} backHref={ROUTES.templates(wardrobeId)}>
      <LinkSection
        links={[
        { label: COMMON_STRINGS.actions.edit, href: ROUTES.templateEdit(wardrobeId, templateId) },
        { label: COMMON_STRINGS.actions.delete, href: ROUTES.templates(wardrobeId) },
        ]}
      />
    </AppLayout>
  );
}
