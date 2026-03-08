import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type HistoryListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HistoryListPage({ params }: HistoryListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="履歴"
      tabKey="histories"
      wardrobeId={wardrobeId}
      description="履歴一覧（タブ）。戻るは表示しません。"
      links={[
        { label: "履歴詳細へ", href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "histories") },
      ]}
    />
  );
}
