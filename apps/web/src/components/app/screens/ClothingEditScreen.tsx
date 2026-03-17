"use client";

import { FormEvent, createElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useClothing, useUpdateClothingMutation } from "@/api/hooks/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { isAppError } from "@/lib/error/normalize";
import { ScreenCard } from "./ScreenPrimitives";

type ClothingEditScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

function resolveErrorMessage(error: unknown): string {
  if (isAppError(error) && error.status === 404) {
    return CLOTHING_STRINGS.detail.messages.notFound;
  }

  return CLOTHING_STRINGS.edit.messages.loadError;
}

export function ClothingEditScreen({ wardrobeId, clothingId }: ClothingEditScreenProps) {
  const router = useRouter();
  const clothingQuery = useClothing(wardrobeId, clothingId);
  const updateMutation = useUpdateClothingMutation(wardrobeId, clothingId);

  const [name, setName] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!clothingQuery.data) {
      return;
    }

    setName(clothingQuery.data.name);
    setImageKey(clothingQuery.data.imageKey ?? "");
  }, [clothingQuery.data]);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameEmpty = trimmedName.length === 0;
  const showNameError = nameTouched && isNameEmpty;
  const isPending = updateMutation.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNameTouched(true);

    if (isNameEmpty || isPending) {
      return;
    }

    await updateMutation.mutateAsync({
      name: trimmedName,
      imageKey: imageKey.trim().length > 0 ? imageKey.trim() : null,
    });

    router.push(ROUTES.clothingDetail(wardrobeId, clothingId));
  };

  const content = (
    <ScreenCard>
      {clothingQuery.isPending ? (
        <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.edit.messages.loading}</p>
      ) : null}

      {clothingQuery.isError ? (
        <p className="m-0 text-sm text-red-700">{resolveErrorMessage(clothingQuery.error)}</p>
      ) : null}

      {clothingQuery.data ? (
        <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-image-key">
            <span>{CLOTHING_STRINGS.edit.labels.image}</span>
            <Input
              id="clothing-image-key"
              name="imageKey"
              type="text"
              value={imageKey}
              onChange={(event) => setImageKey(event.target.value)}
              placeholder={CLOTHING_STRINGS.edit.placeholders.image}
              autoComplete="off"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-name">
            <span>{CLOTHING_STRINGS.edit.labels.name}</span>
            <Input
              id="clothing-name"
              name="name"
              type="text"
              value={name}
              onBlur={() => setNameTouched(true)}
              onChange={(event) => setName(event.target.value)}
              placeholder={CLOTHING_STRINGS.edit.placeholders.name}
              autoComplete="off"
              aria-invalid={showNameError}
              aria-describedby={showNameError ? "clothing-name-error" : undefined}
            />
          </label>

          {showNameError ? (
            <p id="clothing-name-error" className="m-0 text-sm text-red-700">
              {CLOTHING_STRINGS.edit.messages.nameRequired}
            </p>
          ) : null}

          {updateMutation.isError ? (
            <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.edit.messages.submitError}</p>
          ) : null}

          <Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>
            {isPending ? CLOTHING_STRINGS.edit.messages.submitting : CLOTHING_STRINGS.edit.actions.submit}
          </Button>
        </form>
      ) : null}
    </ScreenCard>
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.edit.title,
    backHref: ROUTES.clothingDetail(wardrobeId, clothingId),
    children: content,
  });
}
