import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import Link from "next/link";

type ClothingCreatePageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingCreatePage({ params }: ClothingCreatePageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.create.title} backHref={ROUTES.clothings(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.clothings(wardrobeId)} className="screen-link">
              {CLOTHING_STRINGS.create.actions.submit}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
