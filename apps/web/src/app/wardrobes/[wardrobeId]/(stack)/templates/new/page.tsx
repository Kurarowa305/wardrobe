import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";

type TemplateCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateCreatePage({ params }: TemplateCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={TEMPLATE_STRINGS.create.title}
      backHref={ROUTES.templates(wardrobeId)}
      links={[{ label: TEMPLATE_STRINGS.create.actions.submit, href: ROUTES.templates(wardrobeId) }]}
    />
  );
}
