import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateListPage({ params }: TemplateListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={TEMPLATE_STRINGS.list.title}
      tabKey="templates"
      wardrobeId={wardrobeId}
      links={[
        { label: TEMPLATE_STRINGS.list.actions.add, href: ROUTES.templateNew(wardrobeId) },
        { label: TEMPLATE_STRINGS.detail.title, href: ROUTES.templateDetail(wardrobeId, DEMO_IDS.template) },
      ]}
    />
  );
}
