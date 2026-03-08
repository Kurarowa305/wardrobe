import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingListPage({ params }: ClothingListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={CLOTHING_STRINGS.list.title}
      tabKey="clothings"
      wardrobeId={wardrobeId}
      links={[
        { label: CLOTHING_STRINGS.list.actions.add, href: ROUTES.clothingNew(wardrobeId) },
        { label: CLOTHING_STRINGS.detail.title, href: ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing) },
      ]}
    />
  );
}
