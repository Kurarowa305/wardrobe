"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import { useCreateTemplateMutation, useTemplate, useUpdateTemplateMutation } from "@/api/hooks/template";
import type { ClothingGenreDto } from "@/api/schemas/clothing";
import { ClothingGenreSection } from "@/components/app/screens/ClothingGenreSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_GENRES } from "@/features/clothing/genre";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { OPERATION_TOAST_IDS, appendOperationToast } from "@/features/toast/operationToast";
import { isAppError } from "@/lib/error/normalize";

type TemplateFormMode = "create" | "edit";

type TemplateFormProps = { wardrobeId: string; mode: TemplateFormMode; templateId?: string; submitLabel: string };
type GenreState = { collapsed: boolean };
const TEMPLATE_FORM_CLOTHING_LIMIT = 100;

function createInitialGenreState(): Record<ClothingGenreDto, GenreState> {
  return {
    tops: { collapsed: false },
    bottoms: { collapsed: false },
    others: { collapsed: false },
  };
}

function resolveLoadErrorMessage(error: unknown, mode: TemplateFormMode): string {
  if (isAppError(error) && error.status === 404) return TEMPLATE_STRINGS.messages.templateNotFound;
  return mode === "edit" ? TEMPLATE_STRINGS.edit.messages.loadError : TEMPLATE_STRINGS.create.messages.loadError;
}

export function TemplateForm({ wardrobeId, mode, templateId, submitLabel }: TemplateFormProps) {
  const router = useRouter();
  const templateQuery = useTemplate(wardrobeId, templateId ?? "");
  const createMutation = useCreateTemplateMutation(wardrobeId);
  const updateMutation = useUpdateTemplateMutation(wardrobeId, templateId ?? "");

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [genreStates, setGenreStates] = useState<Record<ClothingGenreDto, GenreState>>(createInitialGenreState);
  const [hasInitializedEditValues, setHasInitializedEditValues] = useState(mode === "create");

  const topsQuery = useClothingList(wardrobeId, { genre: "tops", limit: TEMPLATE_FORM_CLOTHING_LIMIT });
  const bottomsQuery = useClothingList(wardrobeId, { genre: "bottoms", limit: TEMPLATE_FORM_CLOTHING_LIMIT });
  const othersQuery = useClothingList(wardrobeId, { genre: "others", limit: TEMPLATE_FORM_CLOTHING_LIMIT });
  const genreQueries = { tops: topsQuery, bottoms: bottomsQuery, others: othersQuery } as const;

  useEffect(() => {
    setGenreStates(createInitialGenreState());
  }, [wardrobeId]);


  useEffect(() => {
    if (mode !== "edit" || !templateQuery.data || hasInitializedEditValues) return;
    setName(templateQuery.data.name);
    setSelectedClothingIds(templateQuery.data.clothingItems.map((item) => item.clothingId));
    setHasInitializedEditValues(true);
  }, [hasInitializedEditValues, mode, templateQuery.data]);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameEmpty = trimmedName.length === 0;
  const isSelectionEmpty = selectedClothingIds.length === 0;
  const showNameError = nameTouched && isNameEmpty;
  const showSelectionError = nameTouched && isSelectionEmpty;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const showTemplateLoading = mode === "edit" && templateQuery.isPending;
  const showTemplateError = mode === "edit" && templateQuery.isError;
  const hasClothingItems = CLOTHING_GENRES.some((genre) => (genreQueries[genre].data?.items.length ?? 0) > 0);
  const showClothingLoading = CLOTHING_GENRES.every((genre) => genreQueries[genre].isPending);
  const showClothingError = CLOTHING_GENRES.every((genre) => genreQueries[genre].isError);

  const toggleClothing = (clothingId: string) => {
    setSelectedClothingIds((previous) => previous.includes(clothingId) ? previous.filter((currentId) => currentId !== clothingId) : [...previous, clothingId]);
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameTouched(true);
    if (isNameEmpty || isSelectionEmpty || isPending || showTemplateLoading || showTemplateError) return;

    const payload = { name: trimmedName, clothingIds: selectedClothingIds };
    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      router.push(appendOperationToast(ROUTES.templates(wardrobeId), OPERATION_TOAST_IDS.templateCreated));
      return;
    }
    if (!templateId) return;
    await updateMutation.mutateAsync(payload);
    router.push(appendOperationToast(ROUTES.templateDetail(wardrobeId, templateId), OPERATION_TOAST_IDS.templateUpdated));
  };

  return (
    <form className="grid gap-3 pb-24" onSubmit={handleSubmit} noValidate>
      {showTemplateLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.edit.messages.loading}</p> : null}
      {showTemplateError ? <p className="m-0 text-sm text-red-700">{resolveLoadErrorMessage(templateQuery.error, mode)}</p> : null}

      {mode === "create" || templateQuery.data ? (
        <>
          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="template-name">
            <span>{mode === "create" ? TEMPLATE_STRINGS.create.labels.name : TEMPLATE_STRINGS.edit.labels.name}</span>
            <Input id="template-name" name="name" type="text" value={name} onBlur={() => setNameTouched(true)} onChange={(event) => setName(event.target.value)} placeholder={TEMPLATE_STRINGS.placeholders.name} autoComplete="off" aria-invalid={showNameError} aria-describedby={showNameError ? "template-name-error" : undefined} />
          </label>

          {showNameError ? <p id="template-name-error" className="m-0 text-sm text-red-700">{mode === "create" ? TEMPLATE_STRINGS.create.messages.nameRequired : TEMPLATE_STRINGS.edit.messages.nameRequired}</p> : null}

          <fieldset className="grid gap-3 border-0 p-0">
            <legend className="px-0 text-sm font-medium text-slate-900">{mode === "create" ? TEMPLATE_STRINGS.create.labels.selectClothing : TEMPLATE_STRINGS.edit.labels.selectClothing}</legend>
            {showClothingLoading ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.messages.clothingLoading}</p> : null}
            {showClothingError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.messages.clothingLoadError}</p> : null}
            {!showClothingLoading && !showClothingError && !hasClothingItems ? <p className="m-0 text-sm text-slate-600">{TEMPLATE_STRINGS.messages.clothingEmpty}</p> : null}

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
                    emptyMessage={TEMPLATE_STRINGS.messages.clothingSectionEmpty}
                  />
                );
              })}
            </div>
          </fieldset>

          {showSelectionError ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.messages.clothingRequired}</p> : null}
          {createMutation.isError && mode === "create" ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.create.messages.submitError}</p> : null}
          {updateMutation.isError && mode === "edit" ? <p className="m-0 text-sm text-red-700">{TEMPLATE_STRINGS.edit.messages.submitError}</p> : null}

          <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isSelectionEmpty || isPending}>
              {isPending ? (mode === "create" ? TEMPLATE_STRINGS.create.messages.submitting : TEMPLATE_STRINGS.edit.messages.submitting) : submitLabel}
            </Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
