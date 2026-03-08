import { StubScreen } from "@/components/app/layout/StubScreen";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export default function WardrobeCreatePage() {
  return (
    <StubScreen
      title={WARDROBE_STRINGS.create.title}
      links={[{ label: WARDROBE_STRINGS.create.actions.create, href: ROUTES.home(DEMO_IDS.wardrobe) }]}
    />
  );
}
