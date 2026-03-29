import { ClothingDetailScreen } from "@/components/app/screens/ClothingDetailScreen";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

const STATIC_EXPORT_WARDROBE_ID = "wd_static";
const STATIC_EXPORT_CLOTHING_ID = "cl_static";

export function generateStaticParams() {
  return [
    {
      wardrobeId: STATIC_EXPORT_WARDROBE_ID,
      clothingId: STATIC_EXPORT_CLOTHING_ID,
    },
  ];
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingDetailScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
