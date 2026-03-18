import { HistoryDetailScreen } from "@/components/app/screens/HistoryDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { historyDetailFixtures } from "@/mocks/fixtures/history";

type HistoryDetailPageProps = {
  params: Promise<{ wardrobeId: string; historyId: string }>;
};

const MOCK_HISTORY_ID_PREFIX = "hs_mock_";
const MOCK_HISTORY_STATIC_PARAMS_COUNT = 200;

function generateMockStaticHistoryIds() {
  return Array.from({ length: MOCK_HISTORY_STATIC_PARAMS_COUNT }, (_, index) => {
    const sequence = String(index + 1).padStart(4, "0");
    return `${MOCK_HISTORY_ID_PREFIX}${sequence}`;
  });
}

export function generateStaticParams() {
  const historyIds = new Set<string>([
    ...historyDetailFixtures.map((fixture) => fixture.historyId),
    ...generateMockStaticHistoryIds(),
  ]);

  return Array.from(historyIds).map((historyId) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    historyId,
  }));
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { wardrobeId, historyId } = await params;
  return <HistoryDetailScreen wardrobeId={wardrobeId} historyId={historyId} />;
}
