import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";

export default function WardrobeCreatePage() {
  return (
    <StubScreen
      title="ワードローブ作成"
      description="ワードローブ作成画面（スタック）。"
      links={[{ label: "作成してホームへ", href: ROUTES.home(DEMO_IDS.wardrobe) }]}
    />
  );
}
