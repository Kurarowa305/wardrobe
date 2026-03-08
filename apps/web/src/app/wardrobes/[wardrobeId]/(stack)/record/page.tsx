import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import Link from "next/link";

type RecordMethodPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordMethodPage({ params }: RecordMethodPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={RECORD_STRINGS.method.title} backHref={ROUTES.home(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.recordByTemplate(wardrobeId)} className="screen-link">
              {RECORD_STRINGS.method.actions.byTemplate}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.recordByCombination(wardrobeId)} className="screen-link">
              {RECORD_STRINGS.method.actions.byCombination}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
