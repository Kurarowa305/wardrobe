import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";
import { DEMO_IDS } from "@/constants/routes";
import { clothingDetailFixtures } from "@/mocks/fixtures/clothing";

type ClothingEditPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return clothingDetailFixtures.map((fixture) => ({
    wardrobeId: DEMO_IDS.wardrobe,
    clothingId: fixture.clothingId,
  }));
}

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
