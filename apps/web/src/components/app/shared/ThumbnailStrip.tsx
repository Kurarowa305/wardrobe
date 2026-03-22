import { COMMON_STRINGS } from "@/constants/commonStrings";
import { cn } from "@/lib/utils";

export const CARD_THUMBNAIL_LIMIT = 4;

export type CardThumbnailItem = {
  key: string;
  imageUrl: string | null;
  alt: string;
  deleted: boolean;
};

type ThumbnailStripProps = {
  items: CardThumbnailItem[];
  deletedLabel: string;
  className?: string;
  itemClassName?: string;
};

function ThumbnailCell({ item, deletedLabel, className }: { item: CardThumbnailItem; deletedLabel: string; className?: string }) {
  return (
    <span
      className={cn(
        "relative block aspect-square min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100",
        className,
      )}
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.alt} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight text-slate-600">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      {item.deleted ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 px-1 text-center text-[10px] font-semibold text-white">
          {deletedLabel}
        </span>
      ) : null}
    </span>
  );
}

export function ThumbnailStrip({ items, deletedLabel, className, itemClassName }: ThumbnailStripProps) {
  const visibleItems = items.slice(0, CARD_THUMBNAIL_LIMIT);
  const hiddenCount = Math.max(items.length - CARD_THUMBNAIL_LIMIT, 0);
  const columnCount = hiddenCount > 0 ? CARD_THUMBNAIL_LIMIT + 1 : Math.max(visibleItems.length, 1);

  return (
    <span
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {visibleItems.map((item) => (
        <ThumbnailCell key={item.key} item={item} deletedLabel={deletedLabel} className={itemClassName} />
      ))}
      {hiddenCount > 0 ? (
        <span
          className={cn(
            "flex aspect-square min-w-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700",
            itemClassName,
          )}
        >
          +{hiddenCount}
        </span>
      ) : null}
    </span>
  );
}
