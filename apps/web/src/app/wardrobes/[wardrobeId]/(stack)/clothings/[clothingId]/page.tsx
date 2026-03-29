import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
