import { COMMON_STRINGS } from "@/constants/commonStrings";
import { resolveImageUrl } from "@/features/clothing/imageUrl";

type ThumbnailRailItem = {
  id: string;
  name?: string;
  imageKey: string | null;
  deleted: boolean;
};

type ThumbnailRailProps = {
  items: ThumbnailRailItem[];
  deletedLabel: string;
  thumbnailAltSuffix: string;
  imageClassName?: string;
  limit?: number;
};

const DEFAULT_THUMBNAIL_LIMIT = 4;
const THUMBNAIL_SLOT_SIZE = "h-10 w-10 sm:h-12 sm:w-12";
const THUMBNAIL_SLOT_CLASS_NAME = `relative block ${THUMBNAIL_SLOT_SIZE} overflow-hidden rounded-md border border-slate-200 bg-slate-100`;
const THUMBNAIL_RAIL_CLASS_NAME = "flex flex-nowrap gap-1.5 overflow-hidden";

function ThumbnailSlot({
  item,
  deletedLabel,
  thumbnailAltSuffix,
  imageClassName,
}: {
  item: ThumbnailRailItem;
  deletedLabel: string;
  thumbnailAltSuffix: string;
  imageClassName?: string;
}) {
  const imageUrl = resolveImageUrl(item.imageKey);

  return (
    <span className={THUMBNAIL_SLOT_CLASS_NAME}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${item.name ?? "画像"}${thumbnailAltSuffix}`}
          className={imageClassName ?? "h-full w-full object-cover"}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-semibold leading-tight text-slate-600 sm:text-[10px]">
          {COMMON_STRINGS.placeholders.noImage}
        </span>
      )}
      {item.deleted ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 px-1 text-center text-[9px] font-semibold text-white sm:text-[10px]">
          {deletedLabel}
        </span>
      ) : null}
    </span>
  );
}

export function ThumbnailRail({
  items,
  deletedLabel,
  thumbnailAltSuffix,
  imageClassName,
  limit = DEFAULT_THUMBNAIL_LIMIT,
}: ThumbnailRailProps) {
  const visibleItems = items.slice(0, limit);
  const hiddenCount = Math.max(items.length - limit, 0);

  return (
    <span className={THUMBNAIL_RAIL_CLASS_NAME}>
      {visibleItems.map((item) => (
        <ThumbnailSlot
          key={item.id}
          item={item}
          deletedLabel={deletedLabel}
          thumbnailAltSuffix={thumbnailAltSuffix}
          imageClassName={imageClassName}
        />
      ))}
      {hiddenCount > 0 ? (
        <span
          className={`flex ${THUMBNAIL_SLOT_SIZE} items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700`}
        >
          +{hiddenCount}
        </span>
      ) : null}
    </span>
  );
}
