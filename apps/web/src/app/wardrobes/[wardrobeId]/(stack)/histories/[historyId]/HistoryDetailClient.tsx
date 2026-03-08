"use client";

import { StubScreen } from "@/components/app/layout/StubScreen";
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
      title="履歴詳細"
      backHref={backHref}
      description="履歴詳細（スタック）。遷移元に応じて戻り先を分岐します。"
      note={`historyId: ${historyId}`}
      links={[{ label: "削除完了（戻る）", href: backHref }]}
    />
  );
}
