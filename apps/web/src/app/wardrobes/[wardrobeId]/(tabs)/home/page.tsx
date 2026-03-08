import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

type HomePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { wardrobeId } = await params;

  return (
    <StubScreen
      title="My Wardrobe"
      tabKey="home"
      wardrobeId={wardrobeId}
      description="ホーム（タブ）。戻るは表示しません。"
      links={[
        { label: "＋ 着た記録", href: ROUTES.recordMethod(wardrobeId) },
        { label: "履歴を全て見る", href: ROUTES.histories(wardrobeId) },
        { label: "直近履歴（詳細へ）", href: ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "home") },
      ]}
    />
  );
}
