import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";

type RecordByTemplatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByTemplatePage({ params }: RecordByTemplatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={RECORD_STRINGS.byTemplate.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <LinkSection links={[{ label: RECORD_STRINGS.byTemplate.actions.submit, href: ROUTES.home(wardrobeId) }]} />
    </AppLayout>
  );
}
