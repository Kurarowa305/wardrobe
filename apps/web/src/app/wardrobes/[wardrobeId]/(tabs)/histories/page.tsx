import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";

type HistoryListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HistoryListPage({ params }: HistoryListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={HISTORY_STRINGS.list.title}
      tabKey="histories"
      wardrobeId={wardrobeId}
      links={[
        { label: HISTORY_STRINGS.detail.title, href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "histories") },
      ]}
    />
  );
}
