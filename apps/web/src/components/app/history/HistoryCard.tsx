import Link from "next/link";

import { COMMON_STRINGS } from "@/constants/commonStrings";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { formatHistoryDate } from "@/features/history/date";
import { HISTORY_STRINGS } from "@/features/history/strings";
import type { HistoryListClothingItem, HistoryListItem } from "@/features/history/types";

const HISTORY_THUMBNAIL_LIMIT = 4;
const HISTORY_CARD_TITLE_MAX_LENGTH = 15;

function truncateHistoryCardTitle(title: string) {
  return title.length > HISTORY_CARD_TITLE_MAX_LENGTH
    ? `${title.slice(0, HISTORY_CARD_TITLE_MAX_LENGTH)}...`
    : title;
}

function HistoryThumbnail({ item }: { item: HistoryListClothingItem }) {
  const imageUrl = resolveImageUrl(item.imageKey);

  return (
    <span className="relative block h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      {imageUrl ? (
        <img src={imageUrl} alt={`${item.name}のサムネイル`} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      {item.deleted ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 px-1 text-center text-[10px] font-semibold text-white">
          {HISTORY_STRINGS.list.badges.deleted}
        </span>
      ) : null}
    </span>
  );
}

type SharedHistoryCardProps = {
  wardrobeId: string;
  item: HistoryListItem;
  from: "home" | "histories";
};

export function SharedHistoryCard({ wardrobeId, item, from }: SharedHistoryCardProps) {
  const visibleThumbnails = item.clothingItems.slice(0, HISTORY_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(item.clothingItems.length - HISTORY_THUMBNAIL_LIMIT, 0);
  const contextLabel = HISTORY_STRINGS.labels.inputType[item.inputType];
  const combinationTitle = item.clothingItems.map((clothingItem) => clothingItem.name).join("+");
  const title = truncateHistoryCardTitle(
    item.inputType === "template"
      ? item.name ?? HISTORY_STRINGS.list.messages.combinationSummary
      : combinationTitle || HISTORY_STRINGS.list.messages.combinationSummary,
  );

  return (
    <li>
      <Link
        href={ROUTES.historyDetail(wardrobeId, item.historyId, from)}
        className="grid gap-3 rounded-md border border-slate-300 bg-white p-3 text-left no-underline transition-colors hover:bg-slate-50"
      >
        <span className="grid gap-2">
          <span className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">{formatHistoryDate(item.date)}</span>
            <span className="text-[11px] font-medium text-slate-400">{contextLabel}</span>
          </span>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </span>
        <span className="flex flex-wrap gap-2">
          {visibleThumbnails.map((clothingItem) => (
            <HistoryThumbnail key={clothingItem.clothingId} item={clothingItem} />
          ))}
          {hiddenCount > 0 ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700">
              +{hiddenCount}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
