import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordMethodPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordMethodPage({ params }: RecordMethodPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={RECORD_STRINGS.method.title}
      backHref={ROUTES.home(wardrobeId)}
      links={[
        { label: RECORD_STRINGS.method.actions.byTemplate, href: ROUTES.recordByTemplate(wardrobeId) },
        { label: RECORD_STRINGS.method.actions.byCombination, href: ROUTES.recordByCombination(wardrobeId) },
      ]}
    />
  );
}
