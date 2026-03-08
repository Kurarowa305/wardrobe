import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByCombinationPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByCombinationPage({ params }: RecordByCombinationPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={RECORD_STRINGS.byCombination.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <LinkSection links={[{ label: RECORD_STRINGS.byCombination.actions.submit, href: ROUTES.home(wardrobeId) }]} />
    </AppLayout>
  );
}
