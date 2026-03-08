import { HistoriesTabScreen } from "@/components/app/screens/HistoriesTabScreen";

type HistoryListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HistoryListPage({ params }: HistoryListPageProps) {
  const { wardrobeId } = await params;
  return <HistoriesTabScreen wardrobeId={wardrobeId} />;
}
