import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";
import { DEMO_IDS } from "@/constants/routes";
import { clothingDetailFixtures } from "@/mocks/fixtures/clothing";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return clothingDetailFixtures.map((fixture) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    clothingId: fixture.clothingId,
  }));
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
