import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";
import { DEMO_IDS } from "@/constants/routes";

type ClothingEditPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
