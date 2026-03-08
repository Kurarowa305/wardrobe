import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingCreatePage({ params }: ClothingCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.create.title} backHref={ROUTES.clothings(wardrobeId)}>
      <LinkSection links={[{ label: CLOTHING_STRINGS.create.actions.submit, href: ROUTES.clothings(wardrobeId) }]} />
    </AppLayout>
  );
}
