import { HistoryDetailScreen } from "@/components/app/screens/HistoryDetailScreen";

type HistoryDetailPageProps = {
  params: Promise<{ wardrobeId: string; historyId: string }>;
};

const STATIC_EXPORT_WARDROBE_ID = "wd_static";
const STATIC_EXPORT_HISTORY_ID = "hs_static";

export function generateStaticParams() {
  return [
    {
      wardrobeId: STATIC_EXPORT_WARDROBE_ID,
      historyId: STATIC_EXPORT_HISTORY_ID,
    },
  ];
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { wardrobeId, historyId } = await params;
  return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;
}
