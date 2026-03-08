import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { WARDROBE_STRINGS } from "@/features/wardrobe/strings";
import Link from "next/link";

export default function WardrobeCreatePage() {
  return (
    <AppLayout title={WARDROBE_STRINGS.create.title}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.home(DEMO_IDS.wardrobe)} className="screen-link">
              {WARDROBE_STRINGS.create.actions.create}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
