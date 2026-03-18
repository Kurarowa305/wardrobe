"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import {
  useCreateTemplateMutation,
  useTemplate,
  useUpdateTemplateMutation,
} from "@/api/hooks/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import type { ClothingListItem } from "@/features/clothing/types";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { isAppError } from "@/lib/error/normalize";

type TemplateFormMode = "create" | "edit";

type TemplateFormProps = {
  wardrobeId: string;
  mode: TemplateFormMode;
  templateId?: string;
  backHref: string;
  submitLabel: string;
};

type ClothingPage = {
  cursor: string | null;
  items: ClothingListItem[];
};

const TEMPLATE_FORM_CLOTHING_LIMIT = 50;

function resolveLoadErrorMessage(error: unknown, mode: TemplateFormMode): string {
  if (isAppError(error) && error.status === 404) {
    return TEMPLATE_STRINGS.messages.templateNotFound;
  }

  return mode === "edit"
    ? TEMPLATE_STRINGS.edit.messages.loadError
    : TEMPLATE_STRINGS.create.messages.loadError;
}

export function TemplateForm({ wardrobeId, mode, templateId, backHref, submitLabel }: TemplateFormProps) {
  const router = useRouter();
  const templateQuery = useTemplate(wardrobeId, templateId ?? "");
  const createMutation = useCreateTemplateMutation(wardrobeId);
  const updateMutation = useUpdateTemplateMutation(wardrobeId, templateId ?? "");

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<ClothingPage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasInitializedEditValues, setHasInitializedEditValues] = useState(mode === "create");

  const clothingListQuery = useClothingList(wardrobeId, {
    limit: TEMPLATE_FORM_CLOTHING_LIMIT,
    cursor,
  });

  useEffect(() => {
    setCursor(null);
    setPages([]);
    setNextCursor(null);
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

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    if (!templateQuery.data || hasInitializedEditValues) {
      return;
    }

    setName(templateQuery.data.name);
    setSelectedClothingIds(templateQuery.data.clothingItems.map((item) => item.clothingId));
    setHasInitializedEditValues(true);
  }, [hasInitializedEditValues, mode, templateQuery.data]);

  const clothingItems = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameEmpty = trimmedName.length === 0;
  const isSelectionEmpty = selectedClothingIds.length === 0;
  const showNameError = nameTouched && isNameEmpty;
  const showSelectionError = nameTouched && isSelectionEmpty;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const showTemplateLoading = mode === "edit" && templateQuery.isPending;
  const showTemplateError = mode === "edit" && templateQuery.isError;
  const hasClothingItems = clothingItems.length > 0;
  const showClothingLoading = clothingListQuery.isPending && !hasClothingItems;
  const showClothingError = clothingListQuery.isError && !hasClothingItems;
  const canLoadMore = nextCursor !== null && !clothingListQuery.isFetching;

  const toggleClothing = (clothingId: string) => {
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

    setNameTouched(true);

    if (isNameEmpty || isSelectionEmpty || isPending || showTemplateLoading || showTemplateError) {
      return;
    }

    const payload = {
      name: trimmedName,
      clothingIds: selectedClothingIds,
    };

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      router.push(ROUTES.templates(wardrobeId));
      return;
    }

    if (!templateId) {
      return;
    }

    await updateMutation.mutateAsync(payload);
    router.push(ROUTES.templateDetail(wardrobeId, templateId));
  };

  return (
    <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
      {showTemplateLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.edit.messages.loading}</p> : null}

      {showTemplateError ? (
        <p className="m-0 text-sm text-red-700">{resolveLoadErrorMessage(templateQuery.error, mode)}</p>
      ) : null}

      {mode === "create" || templateQuery.data ? (
        <>
          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="template-name">
            <span>{mode === "create" ? TEMPLATE_STRINGS.create.labels.name : TEMPLATE_STRINGS.edit.labels.name}</span>
            <Input
              id="template-name"
              name="name"
              type="text"
              value={name}
              onBlur={() => setNameTouched(true)}
              onChange={(event) => setName(event.target.value)}
              placeholder={TEMPLATE_STRINGS.placeholders.name}
              autoComplete="off"
              aria-invalid={showNameError}
              aria-describedby={showNameError ? "template-name-error" : undefined}
            />
          </label>

          {showNameError ? (
            <p id="template-name-error" className="m-0 text-sm text-red-700">
              {mode === "create"
                ? TEMPLATE_STRINGS.create.messages.nameRequired
                : TEMPLATE_STRINGS.edit.messages.nameRequired}
            </p>
          ) : null}

          <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-900">
              {mode === "create"
                ? TEMPLATE_STRINGS.create.labels.selectClothing
                : TEMPLATE_STRINGS.edit.labels.selectClothing}
            </legend>

            {showClothingLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.messages.clothingLoading}</p> : null}
            {showClothingError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.messages.clothingLoadError}</p> : null}
            {!showClothingLoading && !showClothingError && !hasClothingItems ? (
              <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.messages.clothingEmpty}</p>
            ) : null}

            {hasClothingItems ? (
              <div className="grid gap-2">
                {clothingItems.map((item) => {
                  const checked = selectedClothingIds.includes(item.clothingId);

                  return (
                    <label
                      key={item.clothingId}
                      className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleClothing(item.clothingId)}
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {nextCursor !== null ? (
              <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={!canLoadMore}>
                {clothingListQuery.isFetching
                  ? TEMPLATE_STRINGS.messages.clothingLoading
                  : TEMPLATE_STRINGS.actions.loadMoreClothings}
              </Button>
            ) : null}
          </fieldset>

          {showSelectionError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.messages.clothingRequired}</p> : null}

          {createMutation.isError && mode === "create" ? (
            <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.create.messages.submitError}</p>
          ) : null}
          {updateMutation.isError && mode === "edit" ? (
            <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.edit.messages.submitError}</p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => router.push(backHref)} disabled={isPending}>
              {TEMPLATE_STRINGS.actions.cancel}
            </Button>
            <Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isSelectionEmpty || isPending}>
              {isPending
                ? mode === "create"
                  ? TEMPLATE_STRINGS.create.messages.submitting
                  : TEMPLATE_STRINGS.edit.messages.submitting
                : submitLabel}
            </Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
