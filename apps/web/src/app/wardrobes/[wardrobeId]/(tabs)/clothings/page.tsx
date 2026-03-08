import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingListPage({ params }: ClothingListPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.list.title} tabKey="clothings" wardrobeId={wardrobeId}>
      <LinkSection
        links={[
        { label: CLOTHING_STRINGS.list.actions.add, href: ROUTES.clothingNew(wardrobeId) },
        { label: CLOTHING_STRINGS.detail.title, href: ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing) },
        ]}
      />
    </AppLayout>
  );
}
