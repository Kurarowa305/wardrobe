"use client";

import { FormEvent, createElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useClothingList } from "@/api/hooks/clothing";
import { useTemplate, useUpdateTemplateMutation } from "@/api/hooks/template";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { ROUTES } from "@/constants/routes";
import { TEMPLATE_STRINGS } from "@/features/template/strings";
import { isAppError } from "@/lib/error/normalize";
import { ScreenCard } from "./ScreenPrimitives";
import { TemplateForm } from "./TemplateForm";

type TemplateEditScreenProps = {
  wardrobeId: string;
  templateId: string;
};

const TEMPLATE_FORM_CLOTHING_LIMIT = 100;

function resolveLoadError(error: unknown): string {
  if (isAppError(error) && error.status === 404) {
    return TEMPLATE_STRINGS.detail.messages.notFound;
  }

  return TEMPLATE_STRINGS.edit.messages.loadError;
}

export function TemplateEditScreen({ wardrobeId, templateId }: TemplateEditScreenProps) {
  const router = useRouter();
  const clothingListQuery = useClothingList(wardrobeId, { limit: TEMPLATE_FORM_CLOTHING_LIMIT });
  const templateQuery = useTemplate(wardrobeId, templateId);
  const updateMutation = useUpdateTemplateMutation(wardrobeId, templateId);

  const [name, setName] = useState("");
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
  const [nameTouched, setNameTouched] = useState(false);
  const [clothingTouched, setClothingTouched] = useState(false);

  useEffect(() => {
    if (!templateQuery.data) {
      return;
    }

    setName(templateQuery.data.name);
    setSelectedClothingIds(templateQuery.data.clothingItems.map((item) => item.clothingId));
  }, [templateQuery.data]);

  const trimmedName = useMemo(() => name.trim(), [name]);
  const isPending = updateMutation.isPending;

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

    await updateMutation.mutateAsync({
      name: trimmedName,
      clothingIds: selectedClothingIds,
    });

    router.push(ROUTES.templateDetail(wardrobeId, templateId));
  };

  const loading = templateQuery.isPending || clothingListQuery.isPending;
  const loadError = templateQuery.isError
    ? resolveLoadError(templateQuery.error)
    : clothingListQuery.isError
      ? TEMPLATE_STRINGS.edit.messages.clothingLoadError
      : null;

  const content = (
    <ScreenCard>
      <TemplateForm
        strings={TEMPLATE_STRINGS.edit}
        clothingItems={clothingListQuery.data?.items ?? []}
        selectedClothingIds={selectedClothingIds}
        name={name}
        nameTouched={nameTouched}
        clothingTouched={clothingTouched}
        isSubmitting={isPending}
        submitError={updateMutation.isError}
        loading={loading}
        loadError={loadError}
        template={templateQuery.data}
        onSubmit={handleSubmit}
        onNameBlur={() => setNameTouched(true)}
        onNameChange={setName}
        onClothingTouched={() => setClothingTouched(true)}
        onToggleClothing={handleToggleClothing}
      />
    </ScreenCard>
  );

  return createElement(AppLayout, {
    title: TEMPLATE_STRINGS.edit.title,
    backHref: ROUTES.templateDetail(wardrobeId, templateId),
    children: content,
  });
}
