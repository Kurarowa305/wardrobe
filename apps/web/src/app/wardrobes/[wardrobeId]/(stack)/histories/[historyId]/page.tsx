import { HistoryDetailScreen } from "@/components/app/screens/HistoryDetailScreen";
import { DEMO_IDS } from "@/constants/routes";

type HistoryDetailPageProps = {
  params: Promise<{ wardrobeId: string; historyId: string }>;
};

export function generateStaticParams() {
  return [{ historyId: DEMO_IDS.history }];
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { wardrobeId } = await params;
  return <HistoryDetailScreen wardrobeId={wardrobeId} />;
}
