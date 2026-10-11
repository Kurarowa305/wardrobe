import { HOME_STRINGS } from "@/features/home/strings";
import { COMMON_STRINGS } from "@/constants/commonStrings";
import type { RecommendedTemplate } from "@/api/schemas/home";
import { resolveImageUrl } from "@/features/clothing/imageUrl";
export function RecommendationCard({
  item,
  onClick,
}: {
  item: RecommendedTemplate;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full gap-3 rounded-md border border-slate-300 bg-white p-3 text-left transition-colors hover:bg-slate-50"
    >
      <span className="truncate text-sm font-medium text-slate-900">
        {item.name}
      </span>
      <span className="grid grid-cols-5 gap-2">
        {item.clothingItems.slice(0, 4).map((clothing) => {
          const url = resolveImageUrl(clothing.imageKey);
          return (
            <span
              key={clothing.clothingId}
              className="block aspect-square w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100"
            >
              {url ? (
                <img
                  src={url}
                  alt={HOME_STRINGS.labels.thumbnail}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] text-slate-600">
                  {COMMON_STRINGS.placeholders.noImage}
                </span>
              )}
            </span>
          );
        })}
        {item.clothingItems.length > 4 ? (
          <span className="flex aspect-square items-center justify-center rounded-md border border-dashed bg-slate-50 text-sm">
            +{item.clothingItems.length - 4}
          </span>
        ) : null}
      </span>
    </button>
  );
}
