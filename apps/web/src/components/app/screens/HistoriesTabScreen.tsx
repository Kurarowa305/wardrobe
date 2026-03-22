"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";

import { useHistoryList } from "@/api/hooks/history";
import { SharedHistoryCard } from "@/components/app/history/HistoryCard";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { OPERATION_TOAST_IDS, consumeOperationToast } from "@/features/toast/operationToast";
import type { HistoryListItem } from "@/features/history/types";

type HistoriesTabScreenProps = {
  wardrobeId: string;
};

type HistoryListPage = {
  cursor: string | null;
  items: HistoryListItem[];
};

const HISTORY_LIST_PAGE_SIZE = 20;

export function HistoriesTabScreen({ wardrobeId }: HistoriesTabScreenProps) {
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<HistoryListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isPending, isFetching, isError } = useHistoryList(wardrobeId, {
    limit: HISTORY_LIST_PAGE_SIZE,
    cursor,
  });

  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(window.location.search);
    if (toastId !== OPERATION_TOAST_IDS.historyDeleted) {
      return;
    }

    hasShownToastRef.current = true;
    toast({ title: HISTORY_STRINGS.detail.messages.deleteSuccess });
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
  }, [toast]);

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
  }, [wardrobeId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setPages((previous) => {
      const pageIndex = previous.findIndex((page) => page.cursor === cursor);
      if (pageIndex >= 0) {
        const nextPages = [...previous];
        nextPages[pageIndex] = { cursor, items: data.items };
        return nextPages;
      }

      return [...previous, { cursor, items: data.items }];
    });

    setNextCursor(data.nextCursor);
  }, [cursor, data]);

  const historyItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const hasHistoryItems = historyItems.length > 0;
  const isInitialLoading = isPending && !hasHistoryItems;
  const showInitialError = isError && !hasHistoryItems;
  const showInlineError = isError && hasHistoryItems;
  const showEmptyState = !isInitialLoading && !showInitialError && !hasHistoryItems;
  const canLoadMore = nextCursor !== null && !isFetching;

  const handleLoadMore = () => {
    if (nextCursor === null || isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  const content = (
    <>
      {isInitialLoading ? <p className="m-0 text-sm text-slate-600">{HISTORY_STRINGS.list.messages.loading}</p> : null}

      {showInitialError ? <p className="m-0 text-sm text-red-700">{HISTORY_STRINGS.list.messages.error}</p> : null}

      {showEmptyState ? <p className="m-0 text-sm text-slate-600">{HISTORY_STRINGS.list.messages.empty}</p> : null}

      {hasHistoryItems ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {historyItems.map((item) => (
            <SharedHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} from="histories" />
          ))}
        </ul>
      ) : null}

      {showInlineError ? <p className="m-0 text-sm text-red-700">{HISTORY_STRINGS.list.messages.error}</p> : null}

      {nextCursor !== null ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full text-sm font-medium"
            disabled={!canLoadMore}
            onClick={handleLoadMore}
          >
            {isFetching ? HISTORY_STRINGS.list.messages.loading : HISTORY_STRINGS.list.actions.loadMore}
          </Button>
        </div>
      ) : null}
    </>
  );

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.list.title,
    tabKey: "histories",
    wardrobeId,
    children: content,
  });
}
