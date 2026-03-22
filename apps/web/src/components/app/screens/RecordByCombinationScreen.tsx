"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import { useCreateHistoryMutation } from "@/api/hooks/history";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { RECORD_STRINGS } from "@/features/record/strings";
import { OPERATION_TOAST_IDS, appendOperationToast } from "@/features/toast/operationToast";
import type { ClothingListItem } from "@/features/clothing/types";

type RecordByCombinationScreenProps = {
  wardrobeId: string;
};

type ClothingPage = {
  cursor: string | null;
  items: ClothingListItem[];
};

const RECORD_COMBINATION_CLOTHING_LIMIT = 50;

function createTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function toHistoryApiDate(dateInputValue: string) {
  return dateInputValue.replaceAll("-", "");
}

function ClothingThumbnail({ item }: { item: ClothingListItem }) {
  const imageUrl = resolveImageUrl(item.imageKey);

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={`${item.name}の画像`}
      className="h-14 w-14 rounded-md border border-slate-200 bg-slate-100 object-cover"
    />
  ) : (
    <span className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
      {COMMON_STRINGS.placeholders.noImage}
    </span>
  );
}

export function RecordByCombinationScreen({ wardrobeId }: RecordByCombinationScreenProps) {
  const router = useRouter();
  const createHistoryMutation = useCreateHistoryMutation(wardrobeId);

  const [date, setDate] = useState(createTodayDateString);
  const [dateTouched, setDateTouched] = useState(false);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<ClothingPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const clothingListQuery = useClothingList(wardrobeId, {
    limit: RECORD_COMBINATION_CLOTHING_LIMIT,
    cursor,
  });

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
    setSelectedClothingIds([]);
    setDate(createTodayDateString());
    setDateTouched(false);
    setSelectionTouched(false);
  }, [wardrobeId]);

  useEffect(() => {
    if (!clothingListQuery.data) {
      return;
    }

    setPages((previous) => {
      const pageIndex = previous.findIndex((page) => page.cursor === cursor);
      if (pageIndex >= 0) {
        const nextPages = [...previous];
        nextPages[pageIndex] = { cursor, items: clothingListQuery.data.items };
        return nextPages;
      }

      return [...previous, { cursor, items: clothingListQuery.data.items }];
    });

    setNextCursor(clothingListQuery.data.nextCursor);
  }, [clothingListQuery.data, cursor]);

  const clothingItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const trimmedDate = date.trim();
  const historyApiDate = toHistoryApiDate(trimmedDate);
  const hasClothingItems = clothingItems.length > 0;
  const isDateEmpty = trimmedDate.length === 0;
  const isSelectionEmpty = selectedClothingIds.length === 0;
  const showDateError = dateTouched && isDateEmpty;
  const showSelectionError = selectionTouched && isSelectionEmpty;
  const showClothingLoading = clothingListQuery.isPending && !hasClothingItems;
  const showClothingError = clothingListQuery.isError && !hasClothingItems;
  const showClothingEmpty = !showClothingLoading && !showClothingError && !hasClothingItems;
  const canLoadMore = nextCursor !== null && !clothingListQuery.isFetching;
  const isSubmitting = createHistoryMutation.isPending;

  const toggleClothing = (clothingId: string) => {
    setSelectionTouched(true);
    setSelectedClothingIds((previous) =>
      previous.includes(clothingId)
        ? previous.filter((currentId) => currentId !== clothingId)
        : [...previous, clothingId],
    );
  };

  const handleLoadMore = () => {
    if (nextCursor === null || clothingListQuery.isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setDateTouched(true);
    setSelectionTouched(true);

    if (isDateEmpty || isSelectionEmpty || isSubmitting) {
      return;
    }

    await createHistoryMutation.mutateAsync({
      date: historyApiDate,
      clothingIds: selectedClothingIds,
    });
    router.push(appendOperationToast(ROUTES.home(wardrobeId), OPERATION_TOAST_IDS.historyCreated));
  };

  return (
    <AppLayout title={RECORD_STRINGS.byCombination.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <form className="grid gap-3 pb-24" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="record-combination-date">
          <span>{RECORD_STRINGS.byCombination.labels.date}</span>
          <Input
            id="record-combination-date"
            name="date"
            type="date"
            value={date}
            onBlur={() => setDateTouched(true)}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={showDateError}
            aria-describedby={showDateError ? "record-combination-date-error" : undefined}
          />
        </label>

        {showDateError ? (
          <p id="record-combination-date-error" className="m-0 text-sm text-red-700">
            {RECORD_STRINGS.byCombination.messages.dateRequired}
          </p>
        ) : null}

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="px-0 text-sm font-medium text-slate-900">{RECORD_STRINGS.byCombination.labels.clothing}</legend>

          {showClothingLoading ? (
            <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byCombination.messages.loading}</p>
          ) : null}

          {showClothingError ? (
            <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.loadError}</p>
          ) : null}

          {showClothingEmpty ? (
            <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byCombination.messages.empty}</p>
          ) : null}

          {hasClothingItems ? (
            <div className="grid gap-2">
              {clothingItems.map((item) => {
                const checked = selectedClothingIds.includes(item.clothingId);

                return (
                  <label
                    key={item.clothingId}
                    className={[
                      "grid w-full grid-cols-[56px_minmax(0,1fr)_40px] items-center gap-3 rounded-md border border-slate-300 bg-white p-3 text-left transition-colors",
                      checked
                        ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,white)]"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClothing(item.clothingId)}
                      className="sr-only"
                    />
                    <ClothingThumbnail item={item} />
                    <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
                    <span className="flex justify-end">
                      <span
                        aria-hidden="true"
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                          checked
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-slate-300 bg-white text-transparent",
                        ].join(" ")}
                      >
                        ✓
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {nextCursor !== null ? (
            <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={!canLoadMore}>
              {clothingListQuery.isFetching
                ? RECORD_STRINGS.byCombination.messages.loading
                : RECORD_STRINGS.byCombination.actions.loadMore}
            </Button>
          ) : null}
        </fieldset>

        {showSelectionError ? (
          <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.clothingRequired}</p>
        ) : null}

        {createHistoryMutation.isError ? (
          <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.submitError}</p>
        ) : null}

        <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <Button
            type="submit"
            className="w-full text-sm font-medium"
            disabled={isDateEmpty || isSelectionEmpty || isSubmitting}
          >
            {isSubmitting ? RECORD_STRINGS.byCombination.messages.submitting : RECORD_STRINGS.byCombination.actions.submit}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
