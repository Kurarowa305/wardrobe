import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import Link from "next/link";

type TemplateCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function TemplateCreatePage({ params }: TemplateCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={TEMPLATE_STRINGS.create.title} backHref={ROUTES.templates(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.templates(wardrobeId)} className="screen-link">
              {TEMPLATE_STRINGS.create.actions.submit}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
