import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import Link from "next/link";

type RecordByTemplatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function RecordByTemplatePage({ params }: RecordByTemplatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={RECORD_STRINGS.byTemplate.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.home(wardrobeId)} className="screen-link">
              {RECORD_STRINGS.byTemplate.actions.submit}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
