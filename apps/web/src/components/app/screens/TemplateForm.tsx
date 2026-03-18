"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClothingListItem } from "@/features/clothing/types";
import type { Template } from "@/features/template/types";

type TemplateFormScreenStrings = {
  labels: {
    name: string;
    selectClothing: string;
  };
  placeholders: {
    name: string;
  };
  actions: {
    submit: string;
  };
  messages: {
    loading: string;
    loadError: string;
    nameRequired: string;
    clothingRequired: string;
    submitError: string;
    submitting: string;
    emptyClothing: string;
  };
};

type TemplateFormProps = {
  strings: TemplateFormScreenStrings;
  clothingItems: ClothingListItem[];
  selectedClothingIds: string[];
  name: string;
  nameTouched: boolean;
  clothingTouched: boolean;
  isSubmitting: boolean;
  submitError: boolean;
  loading?: boolean;
  loadError?: string | null;
  template?: Template | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onNameBlur: () => void;
  onNameChange: (value: string) => void;
  onClothingTouched: () => void;
  onToggleClothing: (clothingId: string) => void;
};

export function TemplateForm({
  strings,
  clothingItems,
  selectedClothingIds,
  name,
  nameTouched,
  clothingTouched,
  isSubmitting,
  submitError,
  loading = false,
  loadError = null,
  template,
  onSubmit,
  onNameBlur,
  onNameChange,
  onClothingTouched,
  onToggleClothing,
}: TemplateFormProps) {
  const trimmedName = name.trim();
  const showNameError = nameTouched && trimmedName.length === 0;
  const showClothingError = clothingTouched && selectedClothingIds.length === 0;

  return (
    <form className="grid gap-3" onSubmit={onSubmit} noValidate>
      {loading ? <p className="m-0 text-sm text-slate-600">{strings.messages.loading}</p> : null}
      {loadError ? <p className="m-0 text-sm text-red-700">{loadError}</p> : null}

      {template || (!loading && !loadError) ? (
        <>
          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="template-name">
            <span>{strings.labels.name}</span>
            <Input
              id="template-name"
              name="name"
              type="text"
              value={name}
              onBlur={onNameBlur}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={strings.placeholders.name}
              autoComplete="off"
              aria-invalid={showNameError}
              aria-describedby={showNameError ? "template-name-error" : undefined}
            />
          </label>

          {showNameError ? (
            <p id="template-name-error" className="m-0 text-sm text-red-700">
              {strings.messages.nameRequired}
            </p>
          ) : null}

          <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-900">{strings.labels.selectClothing}</legend>

            {clothingItems.length > 0 ? (
              <div className="grid gap-2">
                {clothingItems.map((item) => {
                  const checked = selectedClothingIds.includes(item.clothingId);

                  return (
                    <label
                      key={item.clothingId}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    >
                      <input
                        type="checkbox"
                        name="clothingIds"
                        value={item.clothingId}
                        checked={checked}
                        onChange={() => {
                          onClothingTouched();
                          onToggleClothing(item.clothingId);
                        }}
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="m-0 text-sm text-slate-600">{strings.messages.emptyClothing}</p>
            )}
          </fieldset>

          {showClothingError ? <p className="m-0 text-sm text-red-700">{strings.messages.clothingRequired}</p> : null}

          {submitError ? <p className="m-0 text-sm text-red-700">{strings.messages.submitError}</p> : null}

          <Button
            type="submit"
            className="w-full text-sm font-medium"
            disabled={trimmedName.length === 0 || selectedClothingIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? strings.messages.submitting : strings.actions.submit}
          </Button>
        </>
      ) : null}
    </form>
  );
}
