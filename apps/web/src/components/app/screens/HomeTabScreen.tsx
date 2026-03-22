"use client";

import Link from "next/link";
import { createElement, useEffect, useRef } from "react";

import { useRecentHistories } from "@/api/hooks/history";
import { SharedHistoryCard } from "@/components/app/history/HistoryCard";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { HOME_STRINGS } from "@/features/home/strings";

type HomeTabScreenProps = {
  wardrobeId: string;
};

export function HomeTabScreen({ wardrobeId }: HomeTabScreenProps) {
  const { toast } = useToast();
  const hasShownCreatedToastRef = useRef(false);
  const recentHistoriesQuery = useRecentHistories(wardrobeId, 7);

  useEffect(() => {
    if (hasShownCreatedToastRef.current || typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("created") !== "1") {
      return;
    }

    hasShownCreatedToastRef.current = true;

    toast({
      title: HOME_STRINGS.toasts.wardrobeCreated.title,
      description: HOME_STRINGS.toasts.wardrobeCreated.description,
    });

    window.history.replaceState(window.history.state, "", ROUTES.home(wardrobeId));
  }, [toast, wardrobeId]);

  const content = (
    <div className="grid gap-4">
      <Button asChild className="w-full justify-start text-left text-base text-white">
        <Link href={ROUTES.recordMethod(wardrobeId)}>{HOME_STRINGS.actions.addRecord}</Link>
      </Button>

      <section className="grid gap-2" aria-labelledby="home-recent-histories-heading">
        <h2 id="home-recent-histories-heading" className="m-0 text-sm font-semibold text-slate-900">
          {HOME_STRINGS.sections.recentWeekHistories}
        </h2>

        {recentHistoriesQuery.isPending ? (
          <p className="m-0 text-sm text-slate-600">{HOME_STRINGS.messages.loadingRecentHistories}</p>
        ) : null}

        {recentHistoriesQuery.isError ? (
          <p className="m-0 text-sm text-red-700">{HOME_STRINGS.messages.errorRecentHistories}</p>
        ) : null}

        {recentHistoriesQuery.data && recentHistoriesQuery.data.items.length === 0 ? (
          <p className="m-0 text-sm text-slate-600">{HOME_STRINGS.messages.emptyRecentHistories}</p>
        ) : null}

        {recentHistoriesQuery.data && recentHistoriesQuery.data.items.length > 0 ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {recentHistoriesQuery.data.items.map((item) => (
              <SharedHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} from="home" />
            ))}
          </ul>
        ) : null}
      </section>

      <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
        <Link href={ROUTES.histories(wardrobeId)}>{HOME_STRINGS.actions.viewAllHistories}</Link>
      </Button>
    </div>
  );

  return createElement(AppLayout, {
    title: HOME_STRINGS.titlePlaceholder,
    tabKey: "home",
    wardrobeId,
    children: content,
  });
}
