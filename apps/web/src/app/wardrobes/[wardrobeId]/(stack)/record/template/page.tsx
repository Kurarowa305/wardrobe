import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByTemplatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByTemplatePage({ params }: RecordByTemplatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={RECORD_STRINGS.byTemplate.title}
      backHref={ROUTES.recordMethod(wardrobeId)}
      links={[{ label: RECORD_STRINGS.byTemplate.actions.submit, href: ROUTES.home(wardrobeId) }]}
    />
  );
}
