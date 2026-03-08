import { AppLayout } from "@/components/app/layout/AppLayout";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import Link from "next/link";

type ClothingDetailPageProps = {
  params: Promise<{ wardrobeId: string; clothingId: string }>;
};

export function generateStaticParams() {
  return [{ clothingId: DEMO_IDS.clothing }];
}

export default async function ClothingDetailPage({ params }: ClothingDetailPageProps) {
  const { wardrobeId, clothingId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.detail.title} backHref={ROUTES.clothings(wardrobeId)}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.clothingEdit(wardrobeId, clothingId)} className="screen-link">
              {COMMON_STRINGS.actions.edit}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.clothings(wardrobeId)} className="screen-link">
              {COMMON_STRINGS.actions.delete}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
