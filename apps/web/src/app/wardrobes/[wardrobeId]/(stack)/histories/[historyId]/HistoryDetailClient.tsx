"use client";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { ROUTES } from "@/constants/routes";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type HistoryDetailClientProps = {
  wardrobeId: string;
};

function resolveBackHref(wardrobeId: string, from: string | null) {
  return from === "home" ? ROUTES.home(wardrobeId) : ROUTES.histories(wardrobeId);
}

export default function HistoryDetailClient({ wardrobeId }: HistoryDetailClientProps) {
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(wardrobeId, searchParams.get("from"));

  return (
    <AppLayout title={HISTORY_STRINGS.detail.title} backHref={backHref}>
      <section className="screen-panel">
        <ul className="screen-link-list">
          <li>
            <Link href={backHref} className="screen-link">
              {HISTORY_STRINGS.detail.menu.delete}
            </Link>
          </li>
        </ul>
      </section>
    </AppLayout>
  );
}
