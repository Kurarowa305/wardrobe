"use client";

import { FormEvent, createElement, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCreateClothingMutation } from "@/api/hooks/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { ScreenCard } from "./ScreenPrimitives";

type ClothingCreateScreenProps = {
  wardrobeId: string;
};

export function ClothingCreateScreen({ wardrobeId }: ClothingCreateScreenProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  const createMutation = useCreateClothingMutation(wardrobeId);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isNameEmpty = trimmedName.length === 0;
  const showNameError = nameTouched && isNameEmpty;
  const isPending = createMutation.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNameTouched(true);

    if (isNameEmpty || isPending) {
      return;
    }

    await createMutation.mutateAsync({
      name: trimmedName,
      imageKey: imageKey.trim().length > 0 ? imageKey.trim() : null,
    });

    router.push(ROUTES.clothings(wardrobeId));
  };

  const content = (
    <ScreenCard>
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-image-key">
          <span>{CLOTHING_STRINGS.create.labels.image}</span>
          <Input
            id="clothing-image-key"
            name="imageKey"
            type="text"
            value={imageKey}
            onChange={(event) => setImageKey(event.target.value)}
            placeholder={CLOTHING_STRINGS.create.placeholders.image}
            autoComplete="off"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-900" htmlFor="clothing-name">
          <span>{CLOTHING_STRINGS.create.labels.name}</span>
          <Input
            id="clothing-name"
            name="name"
            type="text"
            value={name}
            onBlur={() => setNameTouched(true)}
            onChange={(event) => setName(event.target.value)}
            placeholder={CLOTHING_STRINGS.create.placeholders.name}
            autoComplete="off"
            aria-invalid={showNameError}
            aria-describedby={showNameError ? "clothing-name-error" : undefined}
          />
        </label>

        {showNameError ? (
          <p id="clothing-name-error" className="m-0 text-sm text-red-700">
            {CLOTHING_STRINGS.create.messages.nameRequired}
          </p>
        ) : null}

        {createMutation.isError ? (
          <p className="m-0 text-sm text-red-700">{CLOTHING_STRINGS.create.messages.submitError}</p>
        ) : null}

        <Button type="submit" className="w-full text-sm font-medium" disabled={isNameEmpty || isPending}>
          {isPending ? CLOTHING_STRINGS.create.messages.submitting : CLOTHING_STRINGS.create.actions.submit}
        </Button>
      </form>
    </ScreenCard>
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.create.title,
    backHref: ROUTES.clothings(wardrobeId),
    children: content,
  });
}
