import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateListPage({ params }: TemplateListPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.list.title} tabKey="templates" wardrobeId={wardrobeId}>
      <LinkSection
        links={[
        { label: TEMPLATE_STRINGS.list.actions.add, href: ROUTES.templateNew(wardrobeId) },
        { label: TEMPLATE_STRINGS.detail.title, href: ROUTES.templateDetail(wardrobeId, DEMO_IDS.template) },
        ]}
      />
    </AppLayout>
  );
}
