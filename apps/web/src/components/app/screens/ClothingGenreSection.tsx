"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { CLOTHING_GENRE_LABELS, ClothingGenreIcon } from "@/features/clothing/genre";
import type { ClothingGenreDto } from "@/api/schemas/clothing";
import type { ClothingListItem } from "@/features/clothing/types";

type ClothingGenreSectionProps = {
  genre: ClothingGenreDto;
  items: ClothingListItem[];
  collapsed: boolean;
  onToggle: () => void;
  toggleLabel: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectToggle?: (clothingId: string) => void;
  hrefResolver?: (item: ClothingListItem) => string;
  loadMoreLabel?: string;
  loadingLabel?: string;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  emptyMessage?: string;
};

export function ClothingGenreSection({
  genre,
  items,
  collapsed,
  onToggle,
  toggleLabel,
  selectable = false,
  selectedIds = [],
  onSelectToggle,
  hrefResolver,
  loadMoreLabel,
  loadingLabel,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  emptyMessage,
}: ClothingGenreSectionProps) {
  return (
    <section className="grid gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-700" />
          {CLOTHING_GENRE_LABELS[genre]}
        </span>
        <span className="text-xs font-medium text-slate-600">{toggleLabel}</span>
      </button>

      {!collapsed ? (
        items.length > 0 ? (
          <div className="grid gap-2">
            {items.map((item) => {
              const imageUrl = resolveImageUrl(item.imageKey);
              const checked = selectedIds.includes(item.clothingId);
              const baseClassName = [
                "grid w-full grid-cols-[56px_minmax(0,1fr)_40px] items-center gap-3 rounded-md border border-slate-300 bg-white p-3 text-left transition-colors",
                selectable && checked
                  ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,white)]"
                  : "hover:bg-slate-50",
              ].join(" ");

              const body = (
                <>
                  {imageUrl ? (
                    <img src={imageUrl} alt={`${item.name}の画像`} className="h-14 w-14 rounded-md border border-slate-200 bg-slate-100 object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
                      {COMMON_STRINGS.placeholders.noImage}
                    </span>
                  )}
                  <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
                  <span className="flex justify-end">
                    {selectable ? (
                      <span
                        aria-hidden="true"
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                          checked
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-slate-300 bg-white text-transparent",
                        ].join(" ")}
                      >
                        ✓
                      </span>
                    ) : (
                      <ClothingGenreIcon genre={genre} className="h-5 w-5 text-slate-400" />
                    )}
                  </span>
                </>
              );

              if (selectable) {
                return (
                  <label key={item.clothingId} className={baseClassName}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onSelectToggle?.(item.clothingId)}
                      className="sr-only"
                    />
                    {body}
                  </label>
                );
              }

              return (
                <Link key={item.clothingId} href={hrefResolver?.(item) ?? "#"} className={baseClassName}>
                  {body}
                </Link>
              );
            })}

            {onLoadMore ? (
              <Button type="button" variant="secondary" onClick={onLoadMore} disabled={!canLoadMore} className="w-full text-sm font-medium">
                {isLoadingMore ? loadingLabel : loadMoreLabel}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="m-0 text-sm text-slate-600">{emptyMessage ?? `${CLOTHING_GENRE_LABELS[genre]}はまだありません。`}</p>
        )
      ) : null}
    </section>
  );
}
