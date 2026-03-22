"use client";

import { createElement, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useClothing, useDeleteClothingMutation } from "@/api/hooks/clothing";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { CLOTHING_STRINGS } from "@/features/clothing/strings";
import { formatLastWornDate } from "@/features/history/date";
import { OPERATION_TOAST_IDS, appendOperationToast, consumeOperationToast } from "@/features/toast/operationToast";
import { isAppError } from "@/lib/error/normalize";

type ClothingDetailScreenProps = {
  wardrobeId: string;
  clothingId: string;
};

function resolveErrorMessage(error: unknown): string {
  if (isAppError(error) && error.status === 404) {
    return CLOTHING_STRINGS.detail.messages.notFound;
  }

  return CLOTHING_STRINGS.detail.messages.error;
}

export function ClothingDetailScreen({ wardrobeId, clothingId }: ClothingDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const clothingQuery = useClothing(wardrobeId, clothingId);
  const deleteMutation = useDeleteClothingMutation(wardrobeId, clothingId);
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    if (hasShownToastRef.current || typeof window === "undefined") {
      return;
    }

    const { toastId, nextSearch } = consumeOperationToast(window.location.search);
    if (toastId !== OPERATION_TOAST_IDS.clothingUpdated) {
      return;
    }

    hasShownToastRef.current = true;
    toast({ title: CLOTHING_STRINGS.edit.messages.submitSuccess });
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${nextSearch}`);
  }, [toast]);
  const imageUrl = resolveImageUrl(clothingQuery.data?.imageKey);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `${COMMON_STRINGS.dialogs.confirmDelete.title}\n${COMMON_STRINGS.dialogs.confirmDelete.message}`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync();
      router.push(appendOperationToast(ROUTES.clothings(wardrobeId), OPERATION_TOAST_IDS.clothingDeleted));
    } catch {
      toast({
        variant: "destructive",
        title: CLOTHING_STRINGS.detail.messages.deleteError,
      });
    }
  };

  const content = (
    <div className="grid gap-4">
      {clothingQuery.isPending ? (
        <p className="m-0 text-sm text-slate-600">{CLOTHING_STRINGS.detail.messages.loading}</p>
      ) : null}

      {clothingQuery.isError ? (
        <p className="m-0 text-sm text-red-700">{resolveErrorMessage(clothingQuery.error)}</p>
      ) : null}

      {clothingQuery.data ? (
        <>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${clothingQuery.data.name}の画像`}
              className="h-48 w-full rounded-md border border-slate-200 bg-slate-100 object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
              {COMMON_STRINGS.placeholders.noImage}
            </div>
          )}
          <div className="grid gap-1">
            <p className="m-0 text-base font-semibold text-slate-900">{clothingQuery.data.name}</p>
            {clothingQuery.data.deleted ? (
              <p className="m-0 text-sm font-medium text-amber-700">{CLOTHING_STRINGS.detail.messages.deleted}</p>
            ) : null}
          </div>

          <dl className="m-0 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {CLOTHING_STRINGS.detail.labels.wearCount}
              </dt>
              <dd className="m-0 text-sm text-slate-900">{clothingQuery.data.wearCount}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {CLOTHING_STRINGS.detail.labels.lastWornAt}
              </dt>
              <dd className="m-0 text-sm text-slate-900">{formatLastWornDate(clothingQuery.data.lastWornAt, CLOTHING_STRINGS.detail.messages.neverWorn)}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </div>
  );

  return createElement(AppLayout, {
    title: CLOTHING_STRINGS.detail.title,
    backHref: ROUTES.clothings(wardrobeId),
    headerActions: [
      {
        key: "edit",
        label: CLOTHING_STRINGS.detail.menu.edit,
        href: ROUTES.clothingEdit(wardrobeId, clothingId),
        disabled: !clothingQuery.data || clothingQuery.data.deleted,
        icon: "edit",
      },
      {
        key: "delete",
        label: CLOTHING_STRINGS.detail.menu.delete,
        onSelect: handleDelete,
        disabled: !clothingQuery.data || clothingQuery.data.deleted || deleteMutation.isPending,
        icon: "delete",
        tone: "danger",
      },
    ],
    children: content,
  });
}
