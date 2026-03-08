import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import Link from "next/link";

type TemplateEditPageProps = {
  params: Promise<{ wardrobeId: string; templateId: string }>;
};

export function generateStaticParams() {
  return [{ templateId: DEMO_IDS.template }];
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { wardrobeId, templateId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.edit.title} backHref={ROUTES.templateDetail(wardrobeId, templateId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.templateDetail(wardrobeId, templateId)} className="screen-link">
              {TEMPLATE_STRINGS.edit.actions.submit}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
