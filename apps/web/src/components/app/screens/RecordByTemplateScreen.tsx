"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useCreateHistoryMutation } from "@/api/hooks/history";
import { useTemplateList } from "@/api/hooks/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { RECORD_STRINGS } from "@/features/record/strings";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import type { TemplateListClothingItem, TemplateListItem } from "@/features/template/types";
import { ScreenCard } from "./ScreenPrimitives";
import { AppLayout } from "../layout/AppLayout";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

type TemplateListPage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const RECORD_TEMPLATE_PAGE_SIZE = 20;
const TEMPLATE_THUMBNAIL_LIMIT = 4;

function createTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function SelectableTemplateCard({
  item,
  selected,
  onSelect,
}: {
  item: TemplateListItem;
  selected: boolean;
  onSelect: (templateId: string) => void;
}) {
  const visibleThumbnails = item.clothingItems.slice(0, TEMPLATE_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(item.clothingItems.length - TEMPLATE_THUMBNAIL_LIMIT, 0);

  return (
    <label
      className={[
        "grid cursor-pointer gap-3 rounded-md border bg-white p-3 text-left transition-colors",
        selected ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <input
          type="radio"
          name="templateId"
          value={item.templateId}
          checked={selected}
          onChange={(event) => onSelect(event.target.value)}
        />
        <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
      </span>
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
    </label>
  );
}

export function RecordByTemplateScreen({ wardrobeId }: RecordByTemplateScreenProps) {
  const router = useRouter();
  const createHistoryMutation = useCreateHistoryMutation(wardrobeId);

  const [date, setDate] = useState(createTodayInputValue);
  const [touched, setTouched] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<TemplateListPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const templateListQuery = useTemplateList(wardrobeId, {
    limit: RECORD_TEMPLATE_PAGE_SIZE,
    cursor,
  });

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
    setSelectedTemplateId("");
  }, [wardrobeId]);

  useEffect(() => {
    if (!templateListQuery.data) {
      return;
    }

    setPages((previous) => {
      const pageIndex = previous.findIndex((page) => page.cursor === cursor);
      if (pageIndex >= 0) {
        const nextPages = [...previous];
        nextPages[pageIndex] = { cursor, items: templateListQuery.data.items };
        return nextPages;
      }

      return [...previous, { cursor, items: templateListQuery.data.items }];
    });

    setNextCursor(templateListQuery.data.nextCursor);
  }, [cursor, templateListQuery.data]);

  const templateItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const hasTemplateItems = templateItems.length > 0;
  const trimmedDate = date.trim();
  const isDateEmpty = trimmedDate.length === 0;
  const isTemplateEmpty = selectedTemplateId.length === 0;
  const showDateError = touched && isDateEmpty;
  const showTemplateError = touched && isTemplateEmpty;
  const showLoading = templateListQuery.isPending && !hasTemplateItems;
  const showLoadError = templateListQuery.isError && !hasTemplateItems;
  const showEmptyState = !showLoading && !showLoadError && !hasTemplateItems;
  const showInlineError = templateListQuery.isError && hasTemplateItems;
  const canLoadMore = nextCursor !== null && !templateListQuery.isFetching;
  const isPending = createHistoryMutation.isPending;

  const handleLoadMore = () => {
    if (nextCursor === null || templateListQuery.isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched(true);

    if (isDateEmpty || isTemplateEmpty || isPending) {
      return;
    }

    try {
      await createHistoryMutation.mutateAsync({
        date: trimmedDate,
        templateId: selectedTemplateId,
      });
      router.push(ROUTES.home(wardrobeId));
    } catch {
      // mutation state で画面にエラー表示する
    }
  };

  return (
    <AppLayout title={RECORD_STRINGS.byTemplate.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <ScreenCard>
        <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="record-template-date">
            <span>{RECORD_STRINGS.byTemplate.labels.date}</span>
            <Input
              id="record-template-date"
              name="date"
              type="date"
              value={date}
              onBlur={() => setTouched(true)}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={showDateError}
              aria-describedby={showDateError ? "record-template-date-error" : undefined}
            />
          </label>

          {showDateError ? (
            <p id="record-template-date-error" className="m-0 text-sm text-red-700">
              {RECORD_STRINGS.byTemplate.messages.dateRequired}
            </p>
          ) : null}

          <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-900">{RECORD_STRINGS.byTemplate.labels.template}</legend>

            {showLoading ? <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byTemplate.messages.loading}</p> : null}
            {showLoadError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byTemplate.messages.loadError}</p> : null}
            {showEmptyState ? <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byTemplate.messages.empty}</p> : null}

            {hasTemplateItems ? (
              <div className="grid gap-2">
                {templateItems.map((item) => (
                  <SelectableTemplateCard
                    key={item.templateId}
                    item={item}
                    selected={selectedTemplateId === item.templateId}
                    onSelect={setSelectedTemplateId}
                  />
                ))}
              </div>
            ) : null}

            {nextCursor !== null ? (
              <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={!canLoadMore}>
                {templateListQuery.isFetching
                  ? RECORD_STRINGS.byTemplate.messages.loading
                  : RECORD_STRINGS.byTemplate.actions.loadMore}
              </Button>
            ) : null}
          </fieldset>

          {showTemplateError ? (
            <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byTemplate.messages.templateRequired}</p>
          ) : null}
          {showInlineError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byTemplate.messages.loadError}</p> : null}
          {createHistoryMutation.isError ? (
            <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byTemplate.messages.submitError}</p>
          ) : null}

          <Button type="submit" className="w-full text-sm font-medium" disabled={isDateEmpty || isTemplateEmpty || isPending}>
            {isPending ? RECORD_STRINGS.byTemplate.messages.submitting : RECORD_STRINGS.byTemplate.actions.submit}
          </Button>
        </form>
      </ScreenCard>
    </AppLayout>
  );
}
