import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByCombinationPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByCombinationPage({ params }: RecordByCombinationPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={RECORD_STRINGS.byCombination.title}
      backHref={ROUTES.recordMethod(wardrobeId)}
      links={[{ label: RECORD_STRINGS.byCombination.actions.submit, href: ROUTES.home(wardrobeId) }]}
    />
  );
}
