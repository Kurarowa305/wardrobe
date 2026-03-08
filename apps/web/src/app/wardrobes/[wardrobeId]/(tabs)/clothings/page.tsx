import { AppLayout } from "@/components/app/layout/AppLayout";
import { DEMO_IDS, ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import Link from "next/link";

type ClothingListPageProps = {
  params: Promise<{ wardrobeId: string }>;
};

export default async function ClothingListPage({ params }: ClothingListPageProps) {
  const { wardrobeId } = await params;

  return (
    <AppLayout title={CLOTHING_STRINGS.list.title} tabKey="clothings" wardrobeId={wardrobeId}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={ROUTES.clothingNew(wardrobeId)} className="screen-link">
              {CLOTHING_STRINGS.list.actions.add}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.clothingDetail(wardrobeId, DEMO_IDS.clothing)} className="screen-link">
              {CLOTHING_STRINGS.detail.title}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
