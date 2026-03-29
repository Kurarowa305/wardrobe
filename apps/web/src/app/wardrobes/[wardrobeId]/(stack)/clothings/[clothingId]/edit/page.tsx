import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";

type ClothingEditPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
