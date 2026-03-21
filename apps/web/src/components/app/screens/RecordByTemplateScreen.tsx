"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useCreateHistoryMutation } from "@/api/hooks/history";
import { useTemplateList } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import type { TemplateListItem } from "@/features/template/types";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

type TemplatePage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const RECORD_TEMPLATE_LIMIT = 30;

function createTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function toHistoryApiDate(dateInputValue: string) {
  return dateInputValue.replaceAll("-", "");
}

export function RecordByTemplateScreen({
  wardrobeId,
}: RecordByTemplateScreenProps) {
  const router = useRouter();
  const createHistoryMutation = useCreateHistoryMutation(wardrobeId);

  const [date, setDate] = useState(createTodayDateString);
  const [dateTouched, setDateTouched] = useState(false);
  const [templateTouched, setTemplateTouched] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<TemplatePage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const templateListQuery = useTemplateList(wardrobeId, {
    limit: RECORD_TEMPLATE_LIMIT,
    cursor,
  });

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
    setSelectedTemplateId("");
    setDate(createTodayDateString());
    setDateTouched(false);
    setTemplateTouched(false);
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
  }, [templateListQuery.data, cursor]);

  const templateItems = useMemo(
    () => pages.flatMap((page) => page.items),
    [pages],
  );
  const templateItemsById = useMemo(
    () =>
      new Map(templateItems.map((item) => [item.templateId, item] as const)),
    [templateItems],
  );
  const selectedTemplate = useMemo(
    () => templateItemsById.get(selectedTemplateId) ?? null,
    [selectedTemplateId, templateItemsById],
  );

  const trimmedDate = date.trim();
  const historyApiDate = toHistoryApiDate(trimmedDate);
  const hasTemplateItems = templateItems.length > 0;
  const isDateEmpty = trimmedDate.length === 0;
  const isTemplateEmpty = selectedTemplateId.length === 0;
  const showDateError = dateTouched && isDateEmpty;
  const showTemplateError = templateTouched && isTemplateEmpty;
  const showTemplateLoading = templateListQuery.isPending && !hasTemplateItems;
  const showTemplateLoadError = templateListQuery.isError && !hasTemplateItems;
  const showTemplateEmpty =
    !showTemplateLoading && !showTemplateLoadError && !hasTemplateItems;
  const canLoadMore = nextCursor !== null && !templateListQuery.isFetching;
  const isSubmitting = createHistoryMutation.isPending;

  const handleLoadMore = () => {
    if (nextCursor === null || templateListQuery.isFetching) {
      return;
    }

    setCursor(nextCursor);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setDateTouched(true);
    setTemplateTouched(true);

    if (isDateEmpty || isTemplateEmpty || isSubmitting) {
      return;
    }

    await createHistoryMutation.mutateAsync({
      date: historyApiDate,
      templateId: selectedTemplateId,
    });
    router.push(ROUTES.home(wardrobeId));
  };

  return (
    <AppLayout
      title={RECORD_STRINGS.byTemplate.title}
      backHref={ROUTES.recordMethod(wardrobeId)}
    >
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
          <label
            className="grid gap-1 text-sm font-medium text-slate-900"
            htmlFor="record-template-date"
          >
            <span>{RECORD_STRINGS.byTemplate.labels.date}</span>
            <Input
              id="record-template-date"
              name="date"
              type="date"
              value={date}
              onBlur={() => setDateTouched(true)}
              onChange={(event) => setDate(event.target.value)}
              aria-invalid={showDateError}
              aria-describedby={
                showDateError ? "record-template-date-error" : undefined
              }
            />
          </label>

          {showDateError ? (
            <p
              id="record-template-date-error"
              className="m-0 text-sm text-red-700"
            >
              {RECORD_STRINGS.byTemplate.messages.dateRequired}
            </p>
          ) : null}

          <fieldset className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
            <legend className="px-1 text-sm font-medium text-slate-900">
              {RECORD_STRINGS.byTemplate.labels.template}
            </legend>

            {showTemplateLoading ? (
              <p className="m-0 text-sm text-slate-600">
                {RECORD_STRINGS.byTemplate.messages.loading}
              </p>
            ) : null}

            {showTemplateLoadError ? (
              <p className="m-0 text-sm text-red-700">
                {RECORD_STRINGS.byTemplate.messages.loadError}
              </p>
            ) : null}

            {showTemplateEmpty ? (
              <p className="m-0 text-sm text-slate-600">
                {RECORD_STRINGS.byTemplate.messages.empty}
              </p>
            ) : null}

            {selectedTemplate ? (
              <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="m-0 text-sm font-medium text-slate-900">
                  {RECORD_STRINGS.byTemplate.messages.selected}
                </p>
                <p className="m-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
                  {selectedTemplate.name}
                </p>
              </div>
            ) : null}

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
                        checked={checked}
                        onChange={() => {
                          setTemplateTouched(true);
                          setSelectedTemplateId(item.templateId);
                        }}
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {nextCursor !== null ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleLoadMore}
                disabled={!canLoadMore}
              >
                {templateListQuery.isFetching
                  ? RECORD_STRINGS.byTemplate.messages.loading
                  : RECORD_STRINGS.byTemplate.actions.loadMore}
              </Button>
            ) : null}
          </fieldset>

          {showTemplateError ? (
            <p className="m-0 text-sm text-red-700">
              {RECORD_STRINGS.byTemplate.messages.templateRequired}
            </p>
          ) : null}

          {createHistoryMutation.isError ? (
            <p className="m-0 text-sm text-red-700">
              {RECORD_STRINGS.byTemplate.messages.submitError}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full text-sm font-medium"
            disabled={isDateEmpty || isTemplateEmpty || isSubmitting}
          >
            {isSubmitting
              ? RECORD_STRINGS.byTemplate.messages.submitting
              : RECORD_STRINGS.byTemplate.actions.submit}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
