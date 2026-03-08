import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

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
      title="服の編集"
      backHref={ROUTES.clothingDetail(wardrobeId, clothingId)}
      description="服編集（スタック）。"
      note={`clothingId: ${clothingId}`}
      links={[{ label: "保存して詳細へ", href: ROUTES.clothingDetail(wardrobeId, clothingId) }]}
    />
  );
}
