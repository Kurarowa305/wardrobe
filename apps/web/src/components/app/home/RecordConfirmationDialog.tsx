"use client";
import { HomeDialog } from "./HomeDialog";
import { RecommendationCard } from "./RecommendationCard";
import type { ConfirmationSnapshot } from "@/features/record/confirmation";
export function RecordConfirmationDialog({
  snapshot,
  strings,
  onClose,
  onDate,
  onSubmit,
  onRefresh,
}: {
  snapshot: ConfirmationSnapshot;
  strings: {
    title: string;
    date: string;
    cancel: string;
    submit: string;
    submitting: string;
    replay: string;
    refresh: string;
    messages: Record<NonNullable<ConfirmationSnapshot["message"]>, string>;
  };
  onClose: () => void;
  onDate: (date: string) => void;
  onSubmit: () => void;
  onRefresh: () => void;
}) {
  if (!snapshot.open || !snapshot.template) return null;
  const sending = snapshot.phase === "sending",
    unresolved = snapshot.phase === "unknown";
  return (
    <HomeDialog
      title={strings.title}
      hideTitle
      busy={sending}
      onClose={onClose}
    >
      <label className="grid gap-2 text-sm">
        {strings.date}
        <input
          className="min-h-11 rounded-md border p-2 text-base"
          type="date"
          value={snapshot.date}
          disabled={sending || unresolved}
          onChange={(event) => onDate(event.target.value)}
        />
      </label>
      <RecommendationCard item={snapshot.template} />
      {snapshot.message ? (
        <p role="alert" className="text-sm">
          {strings.messages[snapshot.message]}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="min-h-11 rounded-md border p-2"
          type="button"
          disabled={sending}
          onClick={onClose}
        >
          {strings.cancel}
        </button>
        <button
          className="min-h-11 rounded-md bg-slate-900 p-2 text-white disabled:opacity-50"
          type="button"
          disabled={sending}
          onClick={snapshot.phase === "stale" ? onRefresh : onSubmit}
        >
          {sending
            ? strings.submitting
            : snapshot.phase === "stale"
              ? strings.refresh
              : unresolved
                ? strings.replay
                : strings.submit}
        </button>
      </div>
    </HomeDialog>
  );
}
