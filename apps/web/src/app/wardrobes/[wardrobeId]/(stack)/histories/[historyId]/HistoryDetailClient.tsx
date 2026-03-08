"use client";

import { StubScreen } from "@/components/app/layout/StubScreen";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { ROUTES } from "@/constants/routes";
import { useSearchParams } from "next/navigation";

type HistoryDetailClientProps = {
  wardrobeId: string;
  historyId: string;
};

function resolveBackHref(wardrobeId: string, from: string | null) {
  return from === "home" ? ROUTES.home(wardrobeId) : ROUTES.histories(wardrobeId);
}

export default function HistoryDetailClient({ wardrobeId, historyId }: HistoryDetailClientProps) {
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(wardrobeId, searchParams.get("from"));

  return (
    <StubScreen
      title={HISTORY_STRINGS.detail.title}
      backHref={backHref}
      links={[{ label: HISTORY_STRINGS.detail.menu.delete, href: backHref }]}
    />
  );
}
