import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type ClothingListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingListPage({ params }: ClothingListPageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="服"
      tabKey="clothings"
      wardrobeId={wardrobeId}
      description="服一覧（タブ）。戻るは表示しません。"
      links={[
        { label: "＋ 服を追加", href: ROUTES.clothingNew(wardrobeId) },
        { label: "服詳細へ", href: ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing) },
      ]}
    />
  );
}
