import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import Link from "next/link";

type ClothingEditPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingEditPage({ params }: ClothingEditPageProps) {
  const { wardrobeId, clothingId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.edit.title} backHref={ROUTES.clothingDetail(wardrobeId, clothingId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.clothingDetail(wardrobeId, clothingId)} className="screen-link">
              {CLOTHING_STRINGS.edit.actions.submit}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
