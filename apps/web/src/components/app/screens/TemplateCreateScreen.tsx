"use client";

import { FormEvent, createElement, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import { useCreateTemplateMutation } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { ScreenCard } from "./ScreenPrimitives";
import { TemplateForm } from "./TemplateForm";

type TemplateCreateScreenProps = {
  wardrobeId: string;
};

const TEMPLATE_FORM_CLOTHING_LIMIT = 100;

export function TemplateCreateScreen({ wardrobeId }: TemplateCreateScreenProps) {
  const router = useRouter();
  const clothingListQuery = useClothingList(wardrobeId, { limit: TEMPLATE_FORM_CLOTHING_LIMIT });
  const createMutation = useCreateTemplateMutation(wardrobeId);

  const [name, setName] = useState("");
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [nameTouched, setNameTouched] = useState(false);
  const [clothingTouched, setClothingTouched] = useState(false);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isPending = createMutation.isPending;

  const handleToggleClothing = (clothingId: string) => {
    setSelectedClothingIds((current) =>
      current.includes(clothingId) ? current.filter((item) => item !== clothingId) : [...current, clothingId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setNameTouched(true);
    setClothingTouched(true);

    if (trimmedName.length === 0 || selectedClothingIds.length === 0 || isPending) {
      return;
    }

    await createMutation.mutateAsync({
      name: trimmedName,
      clothingIds: selectedClothingIds,
    });

    router.push(ROUTES.templates(wardrobeId));
  };

  const content = (
    <ScreenCard>
      <TemplateForm
        strings={TEMPLATE_STRINGS.create}
        clothingItems={clothingListQuery.data?.items ?? []}
        selectedClothingIds={selectedClothingIds}
        name={name}
        nameTouched={nameTouched}
        clothingTouched={clothingTouched}
        isSubmitting={isPending}
        submitError={createMutation.isError}
        loading={clothingListQuery.isPending}
        loadError={clothingListQuery.isError ? TEMPLATE_STRINGS.create.messages.loadError : null}
        onSubmit={handleSubmit}
        onNameBlur={() => setNameTouched(true)}
        onNameChange={setName}
        onClothingTouched={() => setClothingTouched(true)}
        onToggleClothing={handleToggleClothing}
      />
    </ScreenCard>
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.create.title,
    backHref: ROUTES.templates(wardrobeId),
    children: content,
  });
}
