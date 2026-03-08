import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import Link from "next/link";

type TemplateListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateListPage({ params }: TemplateListPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.list.title} tabKey="templates" wardrobeId={wardrobeId}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.templateNew(wardrobeId)} className="screen-link">
              {TEMPLATE_STRINGS.list.actions.add}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.templateDetail(wardrobeId, DEMO_IDS.template)} className="screen-link">
              {TEMPLATE_STRINGS.detail.title}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
