import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { HOME_STRINGS } from "@/features/home/strings";
import Link from "next/link";

type HomePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={HOME_STRINGS.titlePlaceholder} tabKey="home" wardrobeId={wardrobeId}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.recordMethod(wardrobeId)} className="screen-link">
              {HOME_STRINGS.actions.addRecord}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.histories(wardrobeId)} className="screen-link">
              {HOME_STRINGS.actions.viewAllHistories}
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "home")}
              className="screen-link"
            >
              {HISTORY_STRINGS.detail.title}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
