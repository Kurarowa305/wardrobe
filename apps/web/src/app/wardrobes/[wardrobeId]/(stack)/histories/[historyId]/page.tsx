import { DEMO_IDS } from "@/constants/routes";
import HistoryDetailClient from "./HistoryDetailClient";

type HistoryDetailPageProps = {
  params: Promise<{ wardrobeId: string; historyId: string }>;
};

export function generateStaticParams() {
  return [{ historyId: DEMO_IDS.history }];
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { wardrobeId } = await params;
  return <HistoryDetailClient wardrobeId={wardrobeId} />;
}
