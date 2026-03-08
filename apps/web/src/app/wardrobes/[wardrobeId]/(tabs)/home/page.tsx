import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";

type HomePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={HOME_STRINGS.titlePlaceholder} tabKey="home" wardrobeId={wardrobeId}>
      <LinkSection
        links={[
        { label: HOME_STRINGS.actions.addRecord, href: ROUTES.recordMethod(wardrobeId) },
        { label: HOME_STRINGS.actions.viewAllHistories, href: ROUTES.histories(wardrobeId) },
        { label: HISTORY_STRINGS.detail.title, href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "home") },
        ]}
      />
    </AppLayout>
  );
}
