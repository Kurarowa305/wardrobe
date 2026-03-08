import { AppLayout } from "@/components/app/layout/AppLayout";
import { LinkSection } from "@/components/app/layout/LinkSection";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";

export default function WardrobeCreatePage() {
  return (
    <AppLayout title={WARDROBE_STRINGS.create.title}>
      <LinkSection links={[{ label: WARDROBE_STRINGS.create.actions.create, href: ROUTES.home(DEMO_IDS.wardrobe) }]} />
    </AppLayout>
  );
}
