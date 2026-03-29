import { ClothingEditScreen } from "@/components/app/screens/ClothingEditScreen";

type ClothingEditPageProps = {
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

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;
  return <ClothingEditScreen wardrobeId={wardrobeId} clothingId={clothingId} />;
}
