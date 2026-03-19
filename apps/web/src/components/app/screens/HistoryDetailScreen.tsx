"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, createElement } from "react";

import { useDeleteHistoryMutation } from "@/api/hooks/history";
import { useHistory } from "@/api/hooks/history";
import { AppLayout } from "@/components/app/layout/AppLayout";
import { useToast } from "@/components/ui/use-toast";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { resolveHistoryDetailBackHref } from "@/features/history/routing";
import { HISTORY_STRINGS } from "@/features/history/strings";
import { isAppError } from "@/lib/error/normalize";
import { ScreenCard } from "./ScreenPrimitives";

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

function formatHistoryDate(date: string) {
  if (!/^\d{8}$/.test(date)) {
    return date;
  }

  return `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)}`;
}

function formatLastWornAt(lastWornAt: number | null) {
  if (lastWornAt === null) {
    return HISTORY_STRINGS.detail.messages.neverWorn;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(lastWornAt);
}

function HistoryDetailScreenContent({ wardrobeId, historyId, backHref }: HistoryDetailScreenContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const historyQuery = useHistory(wardrobeId, historyId);
  const deleteMutation = useDeleteHistoryMutation(wardrobeId, historyId);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `${COMMON_STRINGS.dialogs.confirmDelete.title}\n${COMMON_STRINGS.dialogs.confirmDelete.message}`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync();
      router.push(backHref);
    } catch {
      toast({
        variant: "destructive",
        title: HISTORY_STRINGS.detail.messages.deleteError,
      });
    }
  };

  const content = (
    <ScreenCard>
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
              <p className="m-0 text-sm text-slate-700">
                {historyQuery.data.templateName ?? HISTORY_STRINGS.detail.messages.combinationSummary}
              </p>
            </div>
          </div>

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
                        <p className="m-0 text-xs text-slate-600">
                          {HISTORY_STRINGS.detail.labels.clothingLastWornAt}: {formatLastWornAt(item.lastWornAt)}
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
    </ScreenCard>
  );

  return createElement(AppLayout, {
    title: HISTORY_STRINGS.detail.title,
    backHref,
    headerActions: [
      {
        key: "delete",
        label: HISTORY_STRINGS.detail.menu.delete,
        onSelect: handleDelete,
        disabled: !historyQuery.data || deleteMutation.isPending,
      },
    ],
    children: content,
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
