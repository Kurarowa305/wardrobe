"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useClothingList } from "@/api/hooks/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import type { ClothingListItem } from "@/features/clothing/types";

type ClothingsTabScreenProps = {
  wardrobeId: string;
};

type ClothingListPage = {
  cursor: string | null;
  items: ClothingListItem[];
};

const CLOTHING_LIST_PAGE_SIZE = 20;

export function ClothingsTabScreen({ wardrobeId }: ClothingsTabScreenProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<ClothingListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isPending, isFetching, isError } = useClothingList(wardrobeId, {
    limit: CLOTHING_LIST_PAGE_SIZE,
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

  const clothingItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const hasClothingItems = clothingItems.length > 0;
  const isInitialLoading = isPending && !hasClothingItems;
  const showInitialError = isError && !hasClothingItems;
  const showInlineError = isError && hasClothingItems;
  const showEmptyState = !isInitialLoading && !showInitialError && !hasClothingItems;
  const canLoadMore = nextCursor !== null && !isFetching;

  const handleLoadMore = () => {
    if (nextCursor === null || isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  return (
    <AppLayout title={CLOTHING_STRINGS.list.title} tabKey="clothings" wardrobeId={wardrobeId}>
      <>
        <Button asChild className="w-full justify-start text-left text-sm font-medium">
          <Link href={ROUTES.clothingNew(wardrobeId)}>{CLOTHING_STRINGS.list.actions.add}</Link>
        </Button>

        {isInitialLoading ? (
          <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.list.messages.loading}</p>
        ) : null}

        {showInitialError ? (
          <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.list.messages.error}</p>
        ) : null}

        {showEmptyState ? (
          <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.list.messages.empty}</p>
        ) : null}

        {hasClothingItems ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {clothingItems.map((item) => (
              <li key={item.clothingId}>
                <Link
                  href={ROUTES.clothingDetail(wardrobeId, item.clothingId)}
                  className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
                    {item.imageKey ? "image" : COMMON_STRINGS.placeholders.noImage}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {showInlineError ? (
          <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.list.messages.error}</p>
        ) : null}

        {nextCursor !== null ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full text-sm font-medium"
            disabled={!canLoadMore}
            onClick={handleLoadMore}
          >
            {isFetching ? CLOTHING_STRINGS.list.messages.loading : CLOTHING_STRINGS.list.actions.loadMore}
          </Button>
        ) : null}
      </>
    </AppLayout>
  );
}
