"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, createElement } from "react";

import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { ScreenTextCard } from "./ScreenPrimitives";

type HistoryDetailScreenProps = {
  wardrobeId: string;
};

type HistoryDetailScreenContentProps = {
  backHref: string;
};

function HistoryDetailScreenContent({ backHref }: HistoryDetailScreenContentProps) {
  const content = createElement(ScreenTextCard, { text: "履歴の詳細情報" });

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    headerActions: [
      {
        label: HISTORY_STRINGS.detail.menu.delete,
        href: backHref,
      },
    ],
    children: content,
  });
}

function HistoryDetailScreenSearchParams({ wardrobeId }: HistoryDetailScreenProps) {
  const searchParams = useSearchParams();
  const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));

  return <HistoryDetailScreenContent backHref={backHref} />;
}

export function HistoryDetailScreen({ wardrobeId }: HistoryDetailScreenProps) {
  return (
    <Suspense fallback={<HistoryDetailScreenContent backHref={ROUTES.histories(wardrobeId)} />}>
      <HistoryDetailScreenSearchParams wardrobeId={wardrobeId} />
    </Suspense>
  );
}
