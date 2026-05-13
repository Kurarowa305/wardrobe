"use client";

import { AutoLoadTrigger } from "@/components/app/screens/AutoLoadTrigger";
import { ClothingListCard } from "@/components/app/screens/ClothingListCard";
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
  loadingLabel?: string;
  onLoadMore?: () => void;
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
  loadingLabel,
  onLoadMore,
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
              const checked = selectedIds.includes(item.clothingId);
              return (
                <ClothingListCard
                  key={item.clothingId}
                  item={item}
                  href={hrefResolver?.(item)}
                  selectable={selectable}
                  checked={checked}
                  onSelectToggle={onSelectToggle}
                />
              );
            })}

            <AutoLoadTrigger
              enabled={onLoadMore !== undefined}
              isLoading={isLoadingMore}
              onLoadMore={onLoadMore ?? (() => undefined)}
              loadingLabel={loadingLabel}
            />
          </div>
        ) : (
          <p className="m-0 text-sm text-slate-600">{emptyMessage ?? `${CLOTHING_GENRE_LABELS[genre]}はまだありません。`}</p>
        )
      ) : null}
    </section>
  );
}
