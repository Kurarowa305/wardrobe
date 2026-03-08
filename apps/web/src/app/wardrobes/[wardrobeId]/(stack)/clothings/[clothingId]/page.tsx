import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

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
      title="服の詳細"
      backHref={ROUTES.clothings(wardrobeId)}
      description="服詳細（スタック）。"
      note={`clothingId: ${clothingId}`}
      links={[
        { label: "編集へ", href: ROUTES.clothingEdit(wardrobeId, clothingId) },
        { label: "削除して一覧へ", href: ROUTES.clothings(wardrobeId) },
      ]}
    />
  );
}
