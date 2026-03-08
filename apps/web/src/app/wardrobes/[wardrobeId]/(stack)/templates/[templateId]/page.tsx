import { AppLayout } from "@/components/app/layout/AppLayout";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import Link from "next/link";

type TemplateDetailPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { wardrobeId, templateId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.detail.title} backHref={ROUTES.templates(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.templateEdit(wardrobeId, templateId)} className="screen-link">
              {COMMON_STRINGS.actions.edit}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.templates(wardrobeId)} className="screen-link">
              {COMMON_STRINGS.actions.delete}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
