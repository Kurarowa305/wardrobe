"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useRecentWeekHistories } from "@/api/hooks/history";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { HISTORY_STRINGS } from "@/features/history/strings";
import type { HistoryListClothingItem, HistoryListItem } from "@/features/history/types";
import { HOME_STRINGS } from "@/features/home/strings";

type HomeTabScreenProps = {
  wardrobeId: string;
};

const HISTORY_THUMBNAIL_LIMIT = 4;

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

function HomeHistoryCard({ wardrobeId, item }: { wardrobeId: string; item: HistoryListItem }) {
  const visibleThumbnails = item.clothingItems.slice(0, HISTORY_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(item.clothingItems.length - HISTORY_THUMBNAIL_LIMIT, 0);
  const contextLabel = HISTORY_STRINGS.labels.inputType[item.inputType];
  const contextText = item.name ?? HISTORY_STRINGS.list.messages.combinationSummary;

  return (
    <li>
      <Link
        href={ROUTES.historyDetail(wardrobeId, item.historyId, "home")}
        className="grid gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
      >
        <span className="grid gap-1">
          <span className="text-xs font-semibold text-slate-500">{item.date}</span>
          <span className="text-sm font-semibold text-slate-900">{contextLabel}</span>
          <span className="text-sm text-slate-700">{contextText}</span>
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

export function HomeTabScreen({ wardrobeId }: HomeTabScreenProps) {
  const { toast } = useToast();
  const hasShownCreatedToastRef = useRef(false);
  const recentWeekHistoriesQuery = useRecentWeekHistories(wardrobeId);

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

  return (
    <AppLayout title={HOME_STRINGS.titlePlaceholder} tabKey="home" wardrobeId={wardrobeId}>
      <div className="grid gap-4">
        <Button asChild className="w-full justify-start text-left text-sm font-medium">
          <Link href={ROUTES.recordMethod(wardrobeId)}>{HOME_STRINGS.actions.addRecord}</Link>
        </Button>

        <section className="grid gap-2" aria-labelledby="recent-week-histories-heading">
          <h2 id="recent-week-histories-heading" className="m-0 text-sm font-semibold text-slate-900">
            {HOME_STRINGS.sections.recentWeekHistories}
          </h2>

          {recentWeekHistoriesQuery.isPending ? (
            <p className="m-0 text-sm text-slate-600">{HISTORY_STRINGS.list.messages.loading}</p>
          ) : null}

          {recentWeekHistoriesQuery.isError ? (
            <p className="m-0 text-sm text-red-700">{HISTORY_STRINGS.list.messages.error}</p>
          ) : null}

          {recentWeekHistoriesQuery.data && recentWeekHistoriesQuery.data.items.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="m-0 text-sm text-slate-600">{HOME_STRINGS.messages.noRecentHistories}</p>
              </CardContent>
            </Card>
          ) : null}

          {recentWeekHistoriesQuery.data && recentWeekHistoriesQuery.data.items.length > 0 ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {recentWeekHistoriesQuery.data.items.map((item) => (
                <HomeHistoryCard key={item.historyId} wardrobeId={wardrobeId} item={item} />
              ))}
            </ul>
          ) : null}
        </section>

        <Button asChild variant="outline" className="w-full justify-start text-left text-sm font-medium">
          <Link href={ROUTES.histories(wardrobeId)}>{HOME_STRINGS.actions.viewAllHistories}</Link>
        </Button>
      </div>
    </AppLayout>
  );
}
