"use client";

import Link from "next/link";
import { createElement, useEffect, useMemo, useRef, useState } from "react";

import { useTemplateList } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { OPERATION_TOAST_IDS, consumeOperationToast } from "@/features/toast/operationToast";
import type { TemplateListClothingItem, TemplateListItem } from "@/features/template/types";

type TemplatesTabScreenProps = {
  wardrobeId: string;
};

type TemplateListPage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const TEMPLATE_LIST_PAGE_SIZE = 20;
const TEMPLATE_THUMBNAIL_LIMIT = 4;

function TemplateThumbnail({ item }: { item: TemplateListClothingItem }) {
  const imageUrl = resolveImageUrl(item.imageKey);

  return (
    <span className="relative block h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      {imageUrl ? (
        <img src={imageUrl} alt="テンプレート構成服のサムネイル" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      {item.deleted ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 px-1 text-center text-[10px] font-semibold text-white">
          {TEMPLATE_STRINGS.list.badges.deleted}
        </span>
      ) : null}
    </span>
  );
}

function TemplateCard({ wardrobeId, item }: { wardrobeId: string; item: TemplateListItem }) {
  const visibleThumbnails = item.clothingItems.slice(0, TEMPLATE_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(item.clothingItems.length - TEMPLATE_THUMBNAIL_LIMIT, 0);

  return (
    <li>
      <Link
        href={ROUTES.templateDetail(wardrobeId, item.templateId)}
        className="grid w-full gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
      >
        <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
        <span className="flex flex-wrap gap-2">
          {visibleThumbnails.map((clothingItem) => (
            <TemplateThumbnail key={clothingItem.clothingId} item={clothingItem} />
          ))}
          {hiddenCount > 0 ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700">
              +{hiddenCount}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function TemplatesTabScreen({ wardrobeId }: TemplatesTabScreenProps) {
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<TemplateListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isPending, isFetching, isError } = useTemplateList(wardrobeId, {
    limit: TEMPLATE_LIST_PAGE_SIZE,
    cursor,
  });

  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(window.location.search);
    if (toastId === OPERATION_TOAST_IDS.templateCreated) {
      hasShownToastRef.current = true;
      toast({ title: TEMPLATE_STRINGS.create.messages.submitSuccess });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.templateDeleted) {
      hasShownToastRef.current = true;
      toast({ title: TEMPLATE_STRINGS.detail.messages.deleteSuccess });
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
    }
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
      <div className="mb-4">
        <Button asChild className="w-full justify-start text-left text-base text-white">
          <Link href={ROUTES.templateNew(wardrobeId)}>{TEMPLATE_STRINGS.list.actions.add}</Link>
        </Button>
      </div>

      {isInitialLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.list.messages.loading}</p> : null}

      {showInitialError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.list.messages.error}</p> : null}

      {showEmptyState ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.list.messages.empty}</p> : null}

      {hasTemplateItems ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {templateItems.map((item) => (
            <TemplateCard key={item.templateId} wardrobeId={wardrobeId} item={item} />
          ))}
        </ul>
      ) : null}

      {showInlineError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.list.messages.error}</p> : null}

      {nextCursor !== null ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full text-sm font-medium"
            disabled={!canLoadMore}
            onClick={handleLoadMore}
          >
            {isFetching ? TEMPLATE_STRINGS.list.messages.loading : TEMPLATE_STRINGS.list.actions.loadMore}
          </Button>
        </div>
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
