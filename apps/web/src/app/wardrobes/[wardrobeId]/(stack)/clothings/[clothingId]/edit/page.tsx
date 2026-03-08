import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingEditPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;

  return (
    <StubScreen
      title={CLOTHING_STRINGS.edit.title}
      backHref={ROUTES.clothingDetail(wardrobeId, clothingId)}
      links={[{ label: CLOTHING_STRINGS.edit.actions.submit, href: ROUTES.clothingDetail(wardrobeId, clothingId) }]}
    />
  );
}
