"use client";

import Link from "next/link";
import { createElement, useEffect, useMemo, useRef, useState } from "react";

import { useTemplateList } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ThumbnailRail } from "@/components/app/shared/ThumbnailRail";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import {
  OPERATION_TOAST_IDS,
  consumeOperationToast,
} from "@/features/toast/operationToast";
import type { TemplateListItem } from "@/features/template/types";

type TemplatesTabScreenProps = {
  wardrobeId: string;
};

type TemplateListPage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const TEMPLATE_LIST_PAGE_SIZE = 20;
const TEMPLATE_THUMBNAIL_LIMIT = 4;

function TemplateCard({
  wardrobeId,
  item,
}: {
  wardrobeId: string;
  item: TemplateListItem;
}) {
  return (
    <li>
      <Link
        href={ROUTES.templateDetail(wardrobeId, item.templateId)}
        className="grid w-full gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
      >
        <span className="truncate text-sm font-medium text-slate-900">
          {item.name}
        </span>
        <ThumbnailRail
          items={item.clothingItems.map((clothingItem) => ({
            id: clothingItem.clothingId,
            imageKey: clothingItem.imageKey,
            deleted: clothingItem.deleted,
          }))}
          deletedLabel={TEMPLATE_STRINGS.list.badges.deleted}
          thumbnailAltSuffix="のサムネイル"
          limit={TEMPLATE_THUMBNAIL_LIMIT}
        />
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

    const { toastId, nextSearch } = consumeOperationToast(
      window.location.search,
    );
    if (toastId === OPERATION_TOAST_IDS.templateCreated) {
      hasShownToastRef.current = true;
      toast({ title: TEMPLATE_STRINGS.create.messages.submitSuccess });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${nextSearch}`,
      );
      return;
    }

    if (toastId === OPERATION_TOAST_IDS.templateDeleted) {
      hasShownToastRef.current = true;
      toast({ title: TEMPLATE_STRINGS.detail.messages.deleteSuccess });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${nextSearch}`,
      );
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

  const templateItems = useMemo(
    () => pages.flatMap((page) => page.items),
    [pages],
  );
  const hasTemplateItems = templateItems.length > 0;
  const isInitialLoading = isPending && !hasTemplateItems;
  const showInitialError = isError && !hasTemplateItems;
  const showInlineError = isError && hasTemplateItems;
  const showEmptyState =
    !isInitialLoading && !showInitialError && !hasTemplateItems;
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
        <Button
          asChild
          className="w-full justify-start text-left text-base text-white"
        >
          <Link href={ROUTES.templateNew(wardrobeId)}>
            {TEMPLATE_STRINGS.list.actions.add}
          </Link>
        </Button>
      </div>

      {isInitialLoading ? (
        <p className="m-0 text-sm text-slate-600">
          {TEMPLATE_STRINGS.list.messages.loading}
        </p>
      ) : null}

      {showInitialError ? (
        <p className="m-0 text-sm text-red-700">
          {TEMPLATE_STRINGS.list.messages.error}
        </p>
      ) : null}

      {showEmptyState ? (
        <p className="m-0 text-sm text-slate-600">
          {TEMPLATE_STRINGS.list.messages.empty}
        </p>
      ) : null}

      {hasTemplateItems ? (
        <ul className="m-0 grid list-none gap-2 p-0">
          {templateItems.map((item) => (
            <TemplateCard
              key={item.templateId}
              wardrobeId={wardrobeId}
              item={item}
            />
          ))}
        </ul>
      ) : null}

      {showInlineError ? (
        <p className="m-0 text-sm text-red-700">
          {TEMPLATE_STRINGS.list.messages.error}
        </p>
      ) : null}

      {nextCursor !== null ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full text-sm font-medium"
            disabled={!canLoadMore}
            onClick={handleLoadMore}
          >
            {isFetching
              ? TEMPLATE_STRINGS.list.messages.loading
              : TEMPLATE_STRINGS.list.actions.loadMore}
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
