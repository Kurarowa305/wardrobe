import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordMethodPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordMethodPage({ params }: RecordMethodPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={RECORD_STRINGS.method.title} backHref={ROUTES.home(wardrobeId)}>
      <LinkSection
        links={[
        { label: RECORD_STRINGS.method.actions.byTemplate, href: ROUTES.recordByTemplate(wardrobeId) },
        { label: RECORD_STRINGS.method.actions.byCombination, href: ROUTES.recordByCombination(wardrobeId) },
        ]}
      />
    </AppLayout>
  );
}
