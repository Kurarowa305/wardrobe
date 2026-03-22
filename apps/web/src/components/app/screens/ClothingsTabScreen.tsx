"use client";

import Link from "next/link";
import { createElement, useEffect, useRef, useState } from "react";

import { useClothingList } from "@/api/hooks/clothing";
import type { ClothingGenreDto } from "@/api/schemas/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ClothingGenreSection } from "@/components/app/screens/ClothingGenreSection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_GENRES } from "@/features/clothing/genre";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { OPERATION_TOAST_IDS, consumeOperationToast } from "@/features/toast/operationToast";

const CLOTHING_LIST_PAGE_SIZE = 20;

type ClothingsTabScreenProps = { wardrobeId: string };
type GenrePageState = { cursor: string | null; nextCursor: string | null; collapsed: boolean };

function createInitialGenreState(): Record<ClothingGenreDto, GenrePageState> {
  return {
    tops: { cursor: null, nextCursor: null, collapsed: false },
    bottoms: { cursor: null, nextCursor: null, collapsed: false },
    others: { cursor: null, nextCursor: null, collapsed: false },
  };
}

export function ClothingsTabScreen({ wardrobeId }: ClothingsTabScreenProps) {
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);
  const [genreStates, setGenreStates] = useState<Record<ClothingGenreDto, GenrePageState>>(createInitialGenreState);

  const topsQuery = useClothingList(wardrobeId, { genre: "tops", limit: CLOTHING_LIST_PAGE_SIZE, cursor: genreStates.tops.cursor });
  const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms", limit: CLOTHING_LIST_PAGE_SIZE, cursor: genreStates.bottoms.cursor });
  const othersQuery = useClothingList(wardrobeId, { genre: "others", limit: CLOTHING_LIST_PAGE_SIZE, cursor: genreStates.others.cursor });

  const genreQueries = { tops: topsQuery, bottoms: bottomsQuery, others: othersQuery } as const;

  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") return;
    const { toastId, nextSearch } = consumeOperationToast(window.location.search);
    if (toastId === OPERATION_TOAST_IDS.clothingCreated) {
      hasShownToastRef.current = true;
      toast({ title: CLOTHING_STRINGS.create.messages.submitSuccess });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }
    if (toastId === OPERATION_TOAST_IDS.clothingDeleted) {
      hasShownToastRef.current = true;
      toast({ title: CLOTHING_STRINGS.detail.messages.deleteSuccess });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
    }
  }, [toast]);

  useEffect(() => {
    setGenreStates(createInitialGenreState());
  }, [wardrobeId]);

  useEffect(() => {
    for (const genre of CLOTHING_GENRES) {
      const query = genreQueries[genre];
      if (!query.data) continue;
      setGenreStates((previous) => ({
        ...previous,
        [genre]: {
          ...previous[genre],
          nextCursor: query.data.nextCursor,
        },
      }));
    }
  }, [topsQuery.data, bottomsQuery.data, othersQuery.data]);

  const isInitialLoading = CLOTHING_GENRES.every((genre) => genreQueries[genre].isPending);
  const isInitialError = CLOTHING_GENRES.every((genre) => genreQueries[genre].isError);
  const hasAnyItems = CLOTHING_GENRES.some((genre) => (genreQueries[genre].data?.items.length ?? 0) > 0);
  const showEmptyState = !isInitialLoading && !isInitialError && !hasAnyItems;

  const handleLoadMore = (genre: ClothingGenreDto) => {
    const nextCursor = genreStates[genre].nextCursor;
    if (nextCursor === null || genreQueries[genre].isFetching) return;
    setGenreStates((previous) => ({ ...previous, [genre]: { ...previous[genre], cursor: nextCursor } }));
  };

  const toggleSection = (genre: ClothingGenreDto) => {
    setGenreStates((previous) => ({ ...previous, [genre]: { ...previous[genre], collapsed: !previous[genre].collapsed } }));
  };

  const content = (
    <>
      <div className="mb-4">
        <Button asChild className="w-full justify-start text-left text-base text-white">
          <Link href={ROUTES.clothingNew(wardrobeId)}>{CLOTHING_STRINGS.list.actions.add}</Link>
        </Button>
      </div>

      {isInitialLoading ? <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.list.messages.loading}</p> : null}
      {isInitialError ? <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.list.messages.error}</p> : null}
      {showEmptyState ? <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.list.messages.empty}</p> : null}

      <div className="grid gap-4">
        {CLOTHING_GENRES.map((genre) => {
          const query = genreQueries[genre];
          const state = genreStates[genre];
          return (
            <ClothingGenreSection
              key={genre}
              genre={genre}
              items={query.data?.items ?? []}
              collapsed={state.collapsed}
              onToggle={() => toggleSection(genre)}
              toggleLabel={state.collapsed ? CLOTHING_STRINGS.common.expand : CLOTHING_STRINGS.common.collapse}
              hrefResolver={(item) => ROUTES.clothingDetail(wardrobeId, item.clothingId)}
              emptyMessage={CLOTHING_STRINGS.list.messages.sectionEmpty}
              onLoadMore={state.nextCursor !== null ? () => handleLoadMore(genre) : undefined}
              canLoadMore={state.nextCursor !== null && !query.isFetching}
              isLoadingMore={query.isFetching}
              loadingLabel={CLOTHING_STRINGS.list.messages.loading}
              loadMoreLabel={CLOTHING_STRINGS.list.actions.loadMore}
            />
          );
        })}
      </div>
    </>
  );

  return createElement(AppLayout, { title: CLOTHING_STRINGS.list.title, tabKey: "clothings", wardrobeId, children: content });
}
