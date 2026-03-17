import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { clothingDetailFixtures } from "@/mocks/fixtures/clothing";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

const MOCK_CLOTHING_ID_PREFIX = "cl_mock_";
const MOCK_CLOTHING_STATIC_PARAMS_COUNT = 200;

function generateMockStaticClothingIds() {
  return Array.from({ length: MOCK_CLOTHING_STATIC_PARAMS_COUNT }, (_, index) => {
    const sequence = String(index + 1).padStart(4, "0");
    return `${MOCK_CLOTHING_ID_PREFIX}${sequence}`;
  });
}

export function generateStaticParams() {
  const clothingIds = new Set<string>([
    ...clothingDetailFixtures.map((fixture) => fixture.clothingId),
    ...generateMockStaticClothingIds(),
  ]);

  return Array.from(clothingIds).map((clothingId) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    clothingId,
  }));
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
