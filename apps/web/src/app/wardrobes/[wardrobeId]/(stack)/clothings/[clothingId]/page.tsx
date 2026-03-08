import { StubScreen } from "@/components/app/layout/StubScreen";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;

  return (
    <StubScreen
      title={CLOTHING_STRINGS.detail.title}
      backHref={ROUTES.clothings(wardrobeId)}
      links={[
        { label: COMMON_STRINGS.actions.edit, href: ROUTES.clothingEdit(wardrobeId, clothingId) },
        { label: COMMON_STRINGS.actions.delete, href: ROUTES.clothings(wardrobeId) },
      ]}
    />
  );
}
