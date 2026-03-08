import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";
import { DEMO_IDS } from "@/constants/routes";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
