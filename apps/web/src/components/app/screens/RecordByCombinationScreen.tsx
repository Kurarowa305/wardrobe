"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import { useCreateHistoryMutation } from "@/api/hooks/history";
import type { ClothingGenreDto } from "@/api/schemas/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ClothingGenreSection } from "@/components/app/screens/ClothingGenreSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_GENRES } from "@/features/clothing/genre";
import { RECORD_STRINGS } from "@/features/record/strings";
import { OPERATION_TOAST_IDS, appendOperationToast } from "@/features/toast/operationToast";

type RecordByCombinationScreenProps = { wardrobeId: string };
type GenreState = { collapsed: boolean };
const RECORD_COMBINATION_CLOTHING_LIMIT = 100;

function createInitialGenreState(): Record<ClothingGenreDto, GenreState> {
  return {
    tops: { collapsed: false },
    bottoms: { collapsed: false },
    others: { collapsed: false },
  };
}

function createTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function toHistoryApiDate(dateInputValue: string) {
  return dateInputValue.replaceAll("-", "");
}

export function RecordByCombinationScreen({ wardrobeId }: RecordByCombinationScreenProps) {
  const router = useRouter();
  const createHistoryMutation = useCreateHistoryMutation(wardrobeId);

  const [date, setDate] = useState(createTodayDateString);
  const [dateTouched, setDateTouched] = useState(false);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [genreStates, setGenreStates] = useState<Record<ClothingGenreDto, GenreState>>(createInitialGenreState);

  const topsQuery = useClothingList(wardrobeId, { genre: "tops", limit: RECORD_COMBINATION_CLOTHING_LIMIT });
  const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms", limit: RECORD_COMBINATION_CLOTHING_LIMIT });
  const othersQuery = useClothingList(wardrobeId, { genre: "others", limit: RECORD_COMBINATION_CLOTHING_LIMIT });
  const genreQueries = { tops: topsQuery, bottoms: bottomsQuery, others: othersQuery } as const;

  useEffect(() => {
    setGenreStates(createInitialGenreState());
    setSelectedClothingIds([]);
    setDate(createTodayDateString());
    setDateTouched(false);
    setSelectionTouched(false);
  }, [wardrobeId]);


  const trimmedDate = useMemo(() => date.trim(), [date]);
  const historyApiDate = toHistoryApiDate(trimmedDate);
  const hasClothingItems = CLOTHING_GENRES.some((genre) => (genreQueries[genre].data?.items.length ?? 0) > 0);
  const isDateEmpty = trimmedDate.length === 0;
  const isSelectionEmpty = selectedClothingIds.length === 0;
  const showDateError = dateTouched && isDateEmpty;
  const showSelectionError = selectionTouched && isSelectionEmpty;
  const showClothingLoading = CLOTHING_GENRES.every((genre) => genreQueries[genre].isPending);
  const showClothingError = CLOTHING_GENRES.every((genre) => genreQueries[genre].isError);
  const showClothingEmpty = !showClothingLoading && !showClothingError && !hasClothingItems;
  const isSubmitting = createHistoryMutation.isPending;

  const toggleClothing = (clothingId: string) => {
    setSelectionTouched(true);
    setSelectedClothingIds((previous) => previous.includes(clothingId) ? previous.filter((currentId) => currentId !== clothingId) : [...previous, clothingId]);
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDateTouched(true);
    setSelectionTouched(true);
    if (isDateEmpty || isSelectionEmpty || isSubmitting) return;

    await createHistoryMutation.mutateAsync({ date: historyApiDate, clothingIds: selectedClothingIds });
    router.push(appendOperationToast(ROUTES.home(wardrobeId), OPERATION_TOAST_IDS.historyCreated));
  };

  return (
    <AppLayout title={RECORD_STRINGS.byCombination.title} backHref={ROUTES.recordMethod(wardrobeId)}>
      <form className="grid gap-3 pb-24" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="record-combination-date">
          <span>{RECORD_STRINGS.byCombination.labels.date}</span>
          <Input id="record-combination-date" name="date" type="date" value={date} onBlur={() => setDateTouched(true)} onChange={(event) => setDate(event.target.value)} aria-invalid={showDateError} aria-describedby={showDateError ? "record-combination-date-error" : undefined} />
        </label>

        {showDateError ? <p id="record-combination-date-error" className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.dateRequired}</p> : null}

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="px-0 text-sm font-medium text-slate-900">{RECORD_STRINGS.byCombination.labels.clothing}</legend>
          {showClothingLoading ? <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byCombination.messages.loading}</p> : null}
          {showClothingError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.loadError}</p> : null}
          {showClothingEmpty ? <p className="m-0 text-sm text-slate-600">{RECORD_STRINGS.byCombination.messages.empty}</p> : null}

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
                  onToggle={() => setGenreStates((previous) => ({ ...previous, [genre]: { ...previous[genre], collapsed: !previous[genre].collapsed } }))}
                  toggleLabel={state.collapsed ? "展開" : "折りたたむ"}
                  selectable
                  selectedIds={selectedClothingIds}
                  onSelectToggle={toggleClothing}
                  emptyMessage={RECORD_STRINGS.byCombination.messages.sectionEmpty}
                />
              );
            })}
          </div>
        </fieldset>

        {showSelectionError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.clothingRequired}</p> : null}
        {createHistoryMutation.isError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byCombination.messages.submitError}</p> : null}

        <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <Button type="submit" className="w-full text-sm font-medium" disabled={isDateEmpty || isSelectionEmpty || isSubmitting}>
            {isSubmitting ? RECORD_STRINGS.byCombination.messages.submitting : RECORD_STRINGS.byCombination.actions.submit}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
