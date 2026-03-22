"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useCreateHistoryMutation } from "@/api/hooks/history";
import { useTemplateList } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ThumbnailRail } from "@/components/app/shared/ThumbnailRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { RECORD_STRINGS } from "@/features/record/strings";
import {
  OPERATION_TOAST_IDS,
  appendOperationToast,
} from "@/features/toast/operationToast";
import type { TemplateListItem } from "@/features/template/types";

type RecordByTemplateScreenProps = {
  wardrobeId: string;
};

type TemplatePage = {
  cursor: string | null;
  items: TemplateListItem[];
};

const RECORD_TEMPLATE_LIMIT = 30;
const TEMPLATE_THUMBNAIL_LIMIT = 4;

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
    router.push(
      appendOperationToast(
        ROUTES.home(wardrobeId),
        OPERATION_TOAST_IDS.historyCreated,
      ),
    );
  };

  return (
    <AppLayout
      title={RECORD_STRINGS.byTemplate.title}
      backHref={ROUTES.recordMethod(wardrobeId)}
    >
      <div className="grid gap-4">
        <form className="grid gap-3 pb-24" onSubmit={handleSubmit} noValidate>
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

          <fieldset className="grid gap-3 border-0 p-0">
            <legend className="px-0 text-sm font-medium text-slate-900">
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

            {hasTemplateItems ? (
              <div className="grid gap-2">
                {templateItems.map((item) => {
                  const checked = selectedTemplateId === item.templateId;

                  return (
                    <label
                      key={item.templateId}
                      className={[
                        "grid w-full grid-cols-[minmax(0,1fr)_40px] gap-3 rounded-md border border-slate-300 bg-white p-3 text-left transition-colors",
                        checked
                          ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,white)]"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="templateId"
                        checked={checked}
                        onChange={() => {
                          setTemplateTouched(true);
                          setSelectedTemplateId(item.templateId);
                        }}
                        className="sr-only"
                      />
                      <span className="grid gap-3">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {item.name}
                        </span>
                        <ThumbnailRail
                          items={item.clothingItems.map((clothingItem) => ({
                            id: clothingItem.clothingId,
                            imageKey: clothingItem.imageKey,
                            deleted: clothingItem.deleted,
                          }))}
                          deletedLabel={RECORD_STRINGS.common.deleted}
                          thumbnailAltSuffix="のサムネイル"
                          limit={TEMPLATE_THUMBNAIL_LIMIT}
                        />
                      </span>
                      <span className="flex items-start justify-end pt-0.5">
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

          <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <Button
              type="submit"
              className="w-full text-sm font-medium"
              disabled={isDateEmpty || isTemplateEmpty || isSubmitting}
            >
              {isSubmitting
                ? RECORD_STRINGS.byTemplate.messages.submitting
                : RECORD_STRINGS.byTemplate.actions.submit}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
