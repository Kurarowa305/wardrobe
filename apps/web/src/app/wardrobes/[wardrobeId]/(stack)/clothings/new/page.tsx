import { ClothingCreateScreen } from "@/components/app/screens/ClothingCreateScreen";

type ClothingCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingCreatePage({ params }: ClothingCreatePageProps) {
  const { wardrobeId } = await params;
  return <ClothingCreateScreen wardrobeId={wardrobeId} />;
}
