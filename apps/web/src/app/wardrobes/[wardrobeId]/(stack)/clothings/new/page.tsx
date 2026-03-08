import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";

type ClothingCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingCreatePage({ params }: ClothingCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title={CLOTHING_STRINGS.create.title}
      backHref={ROUTES.clothings(wardrobeId)}
      links={[{ label: CLOTHING_STRINGS.create.actions.submit, href: ROUTES.clothings(wardrobeId) }]}
    />
  );
}
