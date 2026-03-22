"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, createElement, useState } from "react";

import { useDeleteHistoryMutation, useHistory } from "@/api/hooks/history";
import { ConfirmDialog } from "@/components/app/dialogs/ConfirmDialog";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { formatHistoryDate } from "@/features/history/date";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { OPERATION_TOAST_IDS, appendOperationToast } from "@/features/toast/operationToast";
import { isAppError } from "@/lib/error/normalize";

type HistoryDetailScreenProps = {
  wardrobeId: string;
  historyId: string;
};

type HistoryDetailScreenContentProps = {
  wardrobeId: string;
  historyId: string;
  backHref: string;
};

function resolveErrorMessage(error: unknown): string {
  if (isAppError(error) && error.status === 404) {
    return HISTORY_STRINGS.detail.messages.notFound;
  }

  return HISTORY_STRINGS.detail.messages.error;
}

function HistoryDetailScreenContent({ wardrobeId, historyId, backHref }: HistoryDetailScreenContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const historyQuery = useHistory(wardrobeId, historyId);
  const deleteMutation = useDeleteHistoryMutation(wardrobeId, historyId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      setIsDeleteDialogOpen(false);
      router.push(appendOperationToast(backHref, OPERATION_TOAST_IDS.historyDeleted));
    } catch {
      toast({
        variant: "destructive",
        title: HISTORY_STRINGS.detail.messages.deleteError,
      });
    }
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setIsDeleteDialogOpen(false);
  };

  const content = (
    <div className="grid gap-4">
      {historyQuery.isPending ? (
        <p className="m-0 text-sm text-slate-600">{HISTORY_STRINGS.detail.messages.loading}</p>
      ) : null}

      {historyQuery.isError ? (
        <p className="m-0 text-sm text-red-700">{resolveErrorMessage(historyQuery.error)}</p>
      ) : null}

      {historyQuery.data ? (
        <>
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-1">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                {HISTORY_STRINGS.detail.labels.date}
              </p>
              <p className="m-0 text-base font-semibold text-slate-900">{formatHistoryDate(historyQuery.data.date)}</p>
            </div>

            <div className="grid gap-1">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                {HISTORY_STRINGS.detail.labels.inputType}
              </p>
              <p className="m-0 text-sm font-medium text-slate-900">
                {HISTORY_STRINGS.labels.inputType[historyQuery.data.inputType]}
              </p>
            </div>
          </div>

          {historyQuery.data.template ? (
            <div className="grid gap-2">
              <p className="m-0 text-sm font-medium text-slate-900">{HISTORY_STRINGS.detail.labels.template}</p>
              <div className="grid gap-1 rounded-md border border-slate-200 bg-white p-3">
                <p className="m-0 text-sm font-medium text-slate-900">{historyQuery.data.template.name}</p>
                <p className="m-0 text-xs text-slate-600">
                  {HISTORY_STRINGS.detail.labels.templateWearCount}: {historyQuery.data.template.wearCount}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <p className="m-0 text-sm font-medium text-slate-900">{HISTORY_STRINGS.detail.labels.clothingItems}</p>
            <ul className="m-0 grid list-none gap-2 p-0">
              {historyQuery.data.clothingItems.map((item) => {
                const imageUrl = resolveImageUrl(item.imageKey);

                return (
                  <li key={item.clothingId}>
                    <div className="grid grid-cols-[4rem_1fr] gap-3 rounded-md border border-slate-200 p-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${item.name}の画像`}
                          className="h-16 w-16 rounded-md border border-slate-200 bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {COMMON_STRINGS.placeholders.noImage}
                        </div>
                      )}

                      <div className="grid gap-1">
                        <p className="m-0 text-sm font-medium text-slate-900">{item.name}</p>
                        {item.deleted ? (
                          <p className="m-0 text-xs font-medium text-amber-700">
                            {HISTORY_STRINGS.detail.messages.clothingDeleted}
                          </p>
                        ) : null}
                        <p className="m-0 text-xs text-slate-600">
                          {HISTORY_STRINGS.detail.labels.clothingWearCount}: {item.wearCount}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    headerActions: [
      {
        key: "delete",
        label: HISTORY_STRINGS.detail.menu.delete,
        onSelect: openDeleteDialog,
        disabled: !historyQuery.data || deleteMutation.isPending,
        icon: "delete",
        tone: "danger",
      },
    ],
    children: (
      <>
        {content}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          title={COMMON_STRINGS.dialogs.confirmDelete.title}
          message={COMMON_STRINGS.dialogs.confirmDelete.message}
          confirmLabel={COMMON_STRINGS.dialogs.confirmDelete.primary}
          cancelLabel={COMMON_STRINGS.dialogs.confirmDelete.secondary}
          onConfirm={handleDelete}
          onCancel={closeDeleteDialog}
          isConfirming={deleteMutation.isPending}
        />
      </>
    ),
  });
}

function HistoryDetailScreenSearchParams({ wardrobeId, historyId }: HistoryDetailScreenProps) {
  const searchParams = useSearchParams();
  const backHref = resolveHistoryDetailBackHref(wardrobeId, searchParams.get("from"));

  return <HistoryDetailScreenContent wardrobeId={wardrobeId} historyId={historyId} backHref={backHref} />;
}

export function HistoryDetailScreen({ wardrobeId, historyId }: HistoryDetailScreenProps) {
  return (
    <Suspense
      fallback={
        <HistoryDetailScreenContent
          wardrobeId={wardrobeId}
          historyId={historyId}
          backHref={ROUTES.histories(wardrobeId)}
        />
      }
    >
      <HistoryDetailScreenSearchParams wardrobeId={wardrobeId} historyId={historyId} />
    </Suspense>
  );
}
