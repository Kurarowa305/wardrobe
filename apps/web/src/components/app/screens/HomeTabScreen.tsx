"use client";

import Link from "next/link";
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useHistoryList } from "@/api/hooks/history";
import { SharedHistoryCard } from "@/components/app/history/HistoryCard";
import { TabBarIcon } from "@/components/ui/tab-bar-icon";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { AutoLoadTrigger } from "@/components/app/screens/AutoLoadTrigger";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { HOME_STRINGS } from "@/features/home/strings";
import { OPERATION_TOAST_IDS, consumeOperationToast } from "@/features/toast/operationToast";
import type { HistoryListItem } from "@/features/history/types";

type HomeTabScreenProps = {
  wardrobeId: string;
};

type RecentHistoryPage = {
  cursor: string | null;
  items: HistoryListItem[];
};

const HOME_RECENT_HISTORY_LIMIT = 30;

export function HomeTabScreen({ wardrobeId }: HomeTabScreenProps) {
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<RecentHistoryPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const recentHistoriesQuery = useHistoryList(wardrobeId, {
    order: "desc",
    limit: HOME_RECENT_HISTORY_LIMIT,
    cursor,
  });

  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(window.location.search);

    if (toastId === OPERATION_TOAST_IDS.wardrobeCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.wardrobeCreated.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyCreated) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyCreated.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.historyDeleted) {
      hasShownToastRef.current = true;
      toast({ title: HOME_STRINGS.toasts.historyDeleted.title });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
    }
  }, [toast, wardrobeId]);

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
  }, [wardrobeId]);

  useEffect(() => {
    if (!recentHistoriesQuery.data) {
      return;
    }

    setPages((previous) => {
      const pageIndex = previous.findIndex((page) => page.cursor === cursor);
      if (pageIndex >= 0) {
        const nextPages = [...previous];
        nextPages[pageIndex] = { cursor, items: recentHistoriesQuery.data.items };
        return nextPages;
      }

      return [...previous, { cursor, items: recentHistoriesQuery.data.items }];
    });

    setNextCursor(recentHistoriesQuery.data.nextCursor);
  }, [cursor, recentHistoriesQuery.data]);

  const recentHistoryItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor === null || recentHistoriesQuery.isFetching) {
      return;
    }

    setCursor(nextCursor);
  }, [nextCursor, recentHistoriesQuery.isFetching]);

  const content = (
    <div className="grid gap-4">
      <Button asChild className="w-full justify-start text-left text-base text-white">
        <Link href={ROUTES.recordMethod(wardrobeId)}>{HOME_STRINGS.actions.addRecord}</Link>
      </Button>

      <section className="grid gap-2" aria-labelledby="home-recent-histories-heading">
        <h2
          id="home-recent-histories-heading"
          className="m-0 flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <TabBarIcon icon="histories" active={false} strokeColor="#000000" className="h-5 w-5" />
          <span>{HOME_STRINGS.sections.recentWeekHistories}</span>
        </h2>

        {recentHistoriesQuery.isPending && recentHistoryItems.length === 0 ? (
          <p className="m-0 text-sm text-slate-600">{HOME_STRINGS.messages.loadingRecentHistories}</p>
        ) : null}

        {recentHistoriesQuery.isError && recentHistoryItems.length === 0 ? (
          <p className="m-0 text-sm text-red-700">{HOME_STRINGS.messages.errorRecentHistories}</p>
        ) : null}

        {recentHistoriesQuery.data && recentHistoryItems.length === 0 ? (
          <p className="m-0 text-sm text-slate-600">{HOME_STRINGS.messages.emptyRecentHistories}</p>
        ) : null}

        {recentHistoryItems.length > 0 ? (
          <>
            <ul className="m-0 grid list-none gap-2 p-0">
              {recentHistoryItems.map((item) => (
                <SharedHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} from="home" />
              ))}
            </ul>
            <AutoLoadTrigger
              enabled={nextCursor !== null}
              isLoading={recentHistoriesQuery.isFetching}
              onLoadMore={handleLoadMore}
              loadingLabel={HOME_STRINGS.messages.loadingRecentHistories}
            />
          </>
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
