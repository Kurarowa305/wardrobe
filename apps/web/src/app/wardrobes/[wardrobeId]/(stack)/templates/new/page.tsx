import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateCreatePage({ params }: TemplateCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.create.title} backHref={ROUTES.templates(wardrobeId)}>
      <LinkSection links={[{ label: TEMPLATE_STRINGS.create.actions.submit, href: ROUTES.templates(wardrobeId) }]} />
    </AppLayout>
  );
}
