import { ClothingsTabScreen } from "@/components/app/screens/ClothingsTabScreen";

type ClothingListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingListPage({ params }: ClothingListPageProps) {
  const { wardrobeId } = await params;
  return <ClothingsTabScreen wardrobeId={wardrobeId} />;
}
