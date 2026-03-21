"use client";

import Link from "next/link";
import { createElement, useEffect, useMemo, useState } from "react";

import { useHistoryList } from "@/api/hooks/history";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { formatHistoryDate } from "@/features/history/date";
import { HISTORY_STRINGS } from "@/features/history/strings";
import type { HistoryListClothingItem, HistoryListItem } from "@/features/history/types";

type HistoriesTabScreenProps = {
  wardrobeId: string;
};

type HistoryListPage = {
  cursor: string | null;
  items: HistoryListItem[];
};

const HISTORY_LIST_PAGE_SIZE = 20;
const HISTORY_THUMBNAIL_LIMIT = 4;
const HISTORY_CARD_TITLE_MAX_LENGTH = 15;

function truncateHistoryCardTitle(title: string) {
  return title.length > HISTORY_CARD_TITLE_MAX_LENGTH
    ? `${title.slice(0, HISTORY_CARD_TITLE_MAX_LENGTH)}...`
    : title;
}

function HistoryThumbnail({ item }: { item: HistoryListClothingItem }) {
  const imageUrl = resolveImageUrl(item.imageKey);

  return (
    <span className="relative block h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      {imageUrl ? (
        <img src={imageUrl} alt={`${item.name}のサムネイル`} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      {item.deleted ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 px-1 text-center text-[10px] font-semibold text-white">
          {HISTORY_STRINGS.list.badges.deleted}
        </span>
      ) : null}
    </span>
  );
}

function HistoryCard({ wardrobeId, item }: { wardrobeId: string; item: HistoryListItem }) {
  const visibleThumbnails = item.clothingItems.slice(0, HISTORY_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(item.clothingItems.length - HISTORY_THUMBNAIL_LIMIT, 0);
  const contextLabel = HISTORY_STRINGS.labels.inputType[item.inputType];
  const combinationTitle = item.clothingItems.map((clothingItem) => clothingItem.name).join("+");
  const title = truncateHistoryCardTitle(
    item.inputType === "template"
      ? item.name ?? HISTORY_STRINGS.list.messages.combinationSummary
      : combinationTitle || HISTORY_STRINGS.list.messages.combinationSummary,
  );

  return (
    <li>
      <Link
        href={ROUTES.historyDetail(wardrobeId, item.historyId, "histories")}
        className="grid gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
      >
        <span className="grid gap-2">
          <span className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">{formatHistoryDate(item.date)}</span>
            <span className="text-[11px] font-medium text-slate-400">{contextLabel}</span>
          </span>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </span>
        <span className="flex flex-wrap gap-2">
          {visibleThumbnails.map((clothingItem) => (
            <HistoryThumbnail key={clothingItem.clothingId} item={clothingItem} />
          ))}
          {hiddenCount > 0 ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700">
              +{hiddenCount}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function HistoriesTabScreen({ wardrobeId }: HistoriesTabScreenProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<HistoryListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isPending, isFetching, isError } = useHistoryList(wardrobeId, {
    limit: HISTORY_LIST_PAGE_SIZE,
    cursor,
  });

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
            <HistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} />
          ))}
        </ul>
      ) : null}

      {showInlineError ? <p className="m-0 text-sm text-red-700">{HISTORY_STRINGS.list.messages.error}</p> : null}

      {nextCursor !== null ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full text-sm font-medium"
          disabled={!canLoadMore}
          onClick={handleLoadMore}
        >
          {isFetching ? HISTORY_STRINGS.list.messages.loading : HISTORY_STRINGS.list.actions.loadMore}
        </Button>
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
