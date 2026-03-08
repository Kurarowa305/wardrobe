import { StubScreen } from "@/components/app/layout/StubScreen";
import { ROUTES } from "@/constants/routes";

type ClothingCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingCreatePage({ params }: ClothingCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="服の追加"
      backHref={ROUTES.clothings(wardrobeId)}
      description="服追加（スタック）。"
      links={[{ label: "追加完了して一覧へ", href: ROUTES.clothings(wardrobeId) }]}
    />
  );
}
