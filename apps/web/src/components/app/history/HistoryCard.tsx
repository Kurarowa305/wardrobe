import Link from "next/link";

import { ThumbnailStrip } from "@/components/app/shared/ThumbnailStrip";
import { ROUTES } from "@/constants/routes";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
import { formatHistoryDate } from "@/features/history/date";
import { HISTORY_STRINGS } from "@/features/history/strings";
import type { HistoryListItem } from "@/features/history/types";

const HISTORY_CARD_TITLE_MAX_LENGTH = 15;

function truncateHistoryCardTitle(title: string) {
  return title.length > HISTORY_CARD_TITLE_MAX_LENGTH
    ? `${title.slice(0, HISTORY_CARD_TITLE_MAX_LENGTH)}...`
    : title;
}

type SharedHistoryCardProps = {
  wardrobeId: string;
  item: HistoryListItem;
  from: "home" | "histories";
};

export function SharedHistoryCard({ wardrobeId, item, from }: SharedHistoryCardProps) {
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
          <span className="text-xs font-semibold text-slate-500">{formatHistoryDate(item.date)}</span>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </span>
        <ThumbnailStrip
          items={item.clothingItems.map((clothingItem) => ({
            key: clothingItem.clothingId,
            imageUrl: resolveImageUrl(clothingItem.imageKey),
            alt: `${clothingItem.name}のサムネイル`,
            deleted: clothingItem.deleted,
          }))}
          deletedLabel={HISTORY_STRINGS.list.badges.deleted}
        />
      </Link>
    </li>
  );
}
