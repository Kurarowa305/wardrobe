"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useCreateHistoryMutation } from "@/api/hooks/history";
import { useTemplateList } from "@/api/hooks/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import type { TemplateListItem } from "@/features/template/types";
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

function createTodayInputValue() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "UTC" });
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

    await createHistoryMutation.mutateAsync({
      date: trimmedDate,
      templateId: selectedTemplateId,
    });
    router.push(ROUTES.home(wardrobeId));
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
                {templateItems.map((item) => {
                  const checked = selectedTemplateId === item.templateId;

                  return (
                    <label
                      key={item.templateId}
                      className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    >
                      <input
                        type="radio"
                        name="templateId"
                        value={item.templateId}
                        checked={checked}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  );
                })}
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

          {showTemplateError ? <p className="m-0 text-sm text-red-700">{RECORD_STRINGS.byTemplate.messages.templateRequired}</p> : null}
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
