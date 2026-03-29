import { HistoryDetailScreen } from "@/components/app/screens/HistoryDetailScreen";

type HistoryDetailPageProps = {
  params: Promise<{ wardrobeId: string; historyId: string }>;
};

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { wardrobeId, historyId } = await params;
  return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;
}
