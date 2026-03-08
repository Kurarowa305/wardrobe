import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { HISTORY_STRINGS } from "@/features/history/strings";
import Link from "next/link";

type HistoryListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function HistoryListPage({ params }: HistoryListPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={HISTORY_STRINGS.list.title} tabKey="histories" wardrobeId={wardrobeId}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link
              href={ROUTES.historyDetail(wardrobeId, DEMO_IDS.history, "histories")}
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
