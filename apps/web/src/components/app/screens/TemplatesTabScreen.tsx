"use client";

import Link from "next/link";
import { createElement, useEffect, useMemo, useState } from "react";

import { useTemplateList } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import type { TemplateListItem } from "@/features/template/types";

type TemplatesTabScreenProps = {
  wardrobeId: string;
};

type TemplateListPage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const TEMPLATE_LIST_PAGE_SIZE = 20;
const TEMPLATE_THUMBNAIL_MAX = 4;

export function TemplatesTabScreen({ wardrobeId }: TemplatesTabScreenProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<TemplateListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isPending, isFetching, isError } = useTemplateList(wardrobeId, {
    limit: TEMPLATE_LIST_PAGE_SIZE,
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

  const templateItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const hasTemplateItems = templateItems.length > 0;
  const isInitialLoading = isPending && !hasTemplateItems;
  const showInitialError = isError && !hasTemplateItems;
  const showInlineError = isError && hasTemplateItems;
  const showEmptyState = !isInitialLoading && !showInitialError && !hasTemplateItems;
  const canLoadMore = nextCursor !== null && !isFetching;

  const handleLoadMore = () => {
    if (nextCursor === null || isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  const content = (
    <>
      <Button asChild className="w-full justify-start text-left text-sm font-medium">
        <Link href={ROUTES.templateNew(wardrobeId)}>{TEMPLATE_STRINGS.list.actions.add}</Link>
      </Button>

      {isInitialLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.list.messages.loading}</p> : null}

      {showInitialError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.list.messages.error}</p> : null}

      {showEmptyState ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.list.messages.empty}</p> : null}

      {hasTemplateItems ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {templateItems.map((item) => {
            const thumbnails = item.clothingItems.slice(0, TEMPLATE_THUMBNAIL_MAX);
            const overflowCount = Math.max(item.clothingItems.length - TEMPLATE_THUMBNAIL_MAX, 0);

            return (
              <li key={item.templateId}>
                <Link
                  href={ROUTES.templateDetail(wardrobeId, item.templateId)}
                  className="grid w-full gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
                >
                  <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>

                  <span className="grid grid-cols-4 gap-2">
                    {thumbnails.map((clothingItem) => {
                      const imageUrl = resolveImageUrl(clothingItem.imageKey);

                      return (
                        <span key={clothingItem.clothingId} className="relative block overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="服サムネイル"
                              className="h-16 w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-16 w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
                              {COMMON_STRINGS.placeholders.noImage}
                            </span>
                          )}

                          {clothingItem.deleted ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-semibold text-white">
                              {TEMPLATE_STRINGS.list.messages.deleted}
                            </span>
                          ) : null}
                        </span>
                      );
                    })}

                    {overflowCount > 0 ? (
                      <span className="flex h-16 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700">
                        +{overflowCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showInlineError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.list.messages.error}</p> : null}

      {nextCursor !== null ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full text-sm font-medium"
          disabled={!canLoadMore}
          onClick={handleLoadMore}
        >
          {isFetching ? TEMPLATE_STRINGS.list.messages.loading : TEMPLATE_STRINGS.list.actions.loadMore}
        </Button>
      ) : null}
    </>
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.list.title,
    tabKey: "templates",
    wardrobeId,
    children: content,
  });
}
